import Promise from 'bluebird';

import Driver from './driver';

export default class Pg extends Driver {

  NAME = 'pg';

  CREATE_STATEMENT =
    `CREATE TABLE IF NOT EXISTS $$tableName$$ (
      id serial PRIMARY KEY,
      name character varying(255),
      applied boolean,
      migration_time timestamp without time zone,
      checksum text
    );`;

  constructor(configuration) {
    super(configuration);
  }

  connect() {
    const self = this;
    const pg = this.getModule();
    const client = this.client = new pg.Client(this.configuration.connection);

    return new Promise(function connectPg(resolve, reject) {
      client.connect(function onPgConnect(err) {
        client.queryAsync = Promise.promisify(client.query);
        client.closeAsync = self._promisifyClose(client);

        if(err) {
          return reject(err);
        }
        self.connected(true);
        resolve(client);
      });
    });
  }

  _promisifyClose(client) {
    return () => new Promise(function endPg(resolve, reject) {
      try {
        client.end();
        resolve();
      } catch(e) {
        reject(e);
      }
    });
  }

  sql(sql) {
    let i = 0;
    return sql.replace(/\?/g, function() {
      i = i + 1;
      return `$${i}`;
    })
  }

  result({ rows }) {
    return rows;
  }
}
