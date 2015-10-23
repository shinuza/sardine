import Promise from 'bluebird';

import Driver from './driver';

export default class Sqlite3Driver extends Driver {

  NAME = 'sqlite3';

  CREATE_STATEMENT =
    `CREATE  TABLE  IF NOT EXISTS "sardine_migrations" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "name" VARCHAR NOT NULL,
      "applied" BOOL NOT NULL,
      "migration_time" DATETIME NOT NULL,
      "checksum" TEXT NOT NULL
    );`;

  constructor(configuration) {
    super();
    const sqlite3 = this.getModule();
    this.db = new sqlite3.Database(configuration.path);
    this.db.runAsync = Promise.promisify(this.db.run);
    this.db.queryAsync = Promise.promisify(this.db.all);
  }

  query(sql, params = []) {
    return this.db.runAsync(this.CREATE_STATEMENT)
      .then((err) => {
        if(err) {
          throw err;
        }
        return this.db.queryAsync(sql, params);
      });
  }

  transaction() {}

  getName() {
    return this.NAME;
  }
}
