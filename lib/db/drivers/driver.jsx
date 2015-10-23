import co from 'co';
import { MissingDependency } from '../../errors';

export default class Driver {
  constructor(configuration) {
    this.configuration = configuration;
  }

  getName() {
    throw new ReferenceError('Not implemented!');
  }

  getModule() {
    const name = this.getName();
    try {
      return require(name);
    }
    catch(e) {
      if(e.code === 'MODULE_NOT_FOUND') {
        throw new MissingDependency(
          `Cannot find module "${name}". You need to run "npm install ${name}" to install it.`);
      }
      throw e;
    }
  }

  query(sql, params = []) {
    if(!this.opened) {
      return Promise.reject(new ReferenceError(`${this.constructor.name}.connect() must be called before doing any query`));
    }

    sql = this.sql(sql);

    return this.client.queryAsync(this.getCreateStatement())
      .then(() => this.client.queryAsync(sql, params))
      .then((res) => this.result(res));
  }

  transaction(queries) {
    if(!this.opened) {
      return Promise.reject(new ReferenceError(`${this.constructor.name}.connect() must be called before doing any transaction`));
    }

    return this.client.queryAsync('BEGIN')
    .then(() =>
      co(function* transactionQuery() {
        for(const query of queries) {
          yield query();
        }
        return Promise.resolve(true);
      })
    )
    .then(() => this.client.queryAsync('COMMIT'))
    .catch((e) => {
      return this.client.queryAsync('ROLLBACK').then(() => {
        throw e;
      });
    });
  }

  close() {
    if(!this.opened) {
      return Promise.reject(new ReferenceError(`Can't close the database, it's not open`));
    }
    return this.client
      .closeAsync()
      .then(() => {
        this.opened = false;
      });
  }


  sql(sql) {
    return sql;
  }

  result(res) {
    return res;
  }

  getName() {
    return this.NAME;
  }

  getCreateStatement() {
    return this.CREATE_STATEMENT.replace('$$tableName$$', this.configuration.tableName);
  }
}
