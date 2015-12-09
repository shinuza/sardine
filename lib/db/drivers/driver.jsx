import _ from 'lodash';
import Promise, { using } from 'bluebird';

import { QueryError, MissingDependency } from '../../errors';

class Driver {

  client = null;

  constructor(config) {
    this.config = config;

    _.bindAll(this, ['result', 'sql']);
  }

  getConnection() {
    throw new ReferenceError('Not implemented!');
  }

  getModule() {
    const name = this.getName();
    try {
      const r = require('path').resolve;
      return require(r(process.cwd(), 'node_modules', name));
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
    const self = this;

    return using(this.getConnection(), (client) => {
      return Promise.coroutine(function* $query() {
        yield client.queryAsync(self.getCreateStatement());
        return client.queryAsync(self.sql(sql), params).then(self.result);
      })()
      .finally(() => client.closeAsync());
    });
  }

  transaction(queries) {
    const self = this;

    return using(this.getConnection(), (client) => {
      return Promise.coroutine(function* transactionQuery() {
        yield client.queryAsync('BEGIN');
        yield client.queryAsync(self.getCreateStatement());

        for(const query of queries) {
          try {
            yield client.queryAsync(self.sql(query.sql), query.params);
          }
          catch(e) {
            yield client.queryAsync('ROLLBACK');
            throw new QueryError(e, query);
          }
        }

        return client.queryAsync('COMMIT');
      })()
      .finally(() => client.closeAsync());
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

  getTableName() {
    return this.config.tableName;
  }

  getCreateStatement() {
    return this.CREATE_STATEMENT.replace('$$tableName$$', this.getTableName(this.config.tableName));
  }
}

export default Driver;
