import Promise from 'bluebird';

import Driver from './driver';

class SQLite3Driver extends Driver {

  NAME = 'sqlite3';

  CREATE_STATEMENT =
    `CREATE  TABLE  IF NOT EXISTS "$$tableName$$" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "name" VARCHAR NOT NULL,
      "applied" BOOL NOT NULL,
      "migration_time" DATETIME NOT NULL,
      "checksum" TEXT NOT NULL
    );`;

  constructor(config) {
    super(config);
  }

  getConnection() {
    let client;
    const { config } = this;
    const sqlite3 = this.getModule();

    return new Promise(function connectSQLite3(resolve, reject) {
      client = new sqlite3.Database(config.connection.path);
      client.on('open', function onSQLite3Connect(err) {
        if(err) {
          return reject(err);
        }
        client.queryAsync = Promise.promisify(client.all);
        client.closeAsync = Promise.promisify(client.close);

        resolve(client);
      });
    });
  }
}

export default SQLite3Driver;
