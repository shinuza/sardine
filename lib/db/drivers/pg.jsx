import Promise from 'bluebird';

import Driver from './driver';

const SCHEMA_NAME = 'migrations';

class Pg extends Driver {

  NAME = 'pg';

  CREATE_STATEMENT =
    `
    CREATE SCHEMA IF NOT EXISTS ${SCHEMA_NAME};
    CREATE TABLE IF NOT EXISTS $$tableName$$ (
      id serial PRIMARY KEY,
      name character varying(255) not null,
      applied boolean not null,
      migration_time timestamp without time zone not null,
      checksum text not null
    );`;

  constructor(config) {
    super(config);
  }

  getConnection() {
    const self = this;
    const pg = this.getModule();
    const client = new pg.Client(this.config.connection);

    return new Promise(function connectPg(resolve, reject) {
      client.connect(function onPgConnect(err) {
        client.queryAsync = Promise.promisify(client.query);
        client.closeAsync = self._promisifyClose(client);

        if(err) {
          return reject(err);
        }
        resolve(client);
      });
    });
  }

  _promisifyClose(client) {
    return () => Promise.try(function endPg() {
      client.end();
    });
  }

  sql(sql) {
    let i = 0;
    return sql.replace(/\?/g, () => {
      i = i + 1;
      return `$${i}`;
    });
  }

  result({ rows }) {
    return rows;
  }

  getTableName() {
    return `${SCHEMA_NAME}.${super.getTableName()}`;
  }
}

export default Pg;
