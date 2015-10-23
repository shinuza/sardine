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
    return this.client.queryAsync(this.getCreateStatement())
      .then(() => this.client.queryAsync(sql, params));
  }

  transaction(queries) {
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
    return this.client.closeAsync();
  }

  getName() {
    return this.NAME;
  }

  getCreateStatement() {
    return this.CREATE_STATEMENT;
  }
}
