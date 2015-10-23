import co from 'co';
import Promise from 'bluebird';

import Driver from './driver';

export default class SQLite3Driver extends Driver {

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
    this.db.closeAsync = Promise.promisify(this.db.close);
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

  transaction(queries) {
    return this.db.runAsync('BEGIN')
    .then(() =>
      co(function* transactionQuery() {
        for(const query of queries) {
          yield query();
        }
        return Promise.resolve(true);
      })
    )
    .then(() => this.db.runAsync('COMMIT'))
    .catch((e) => {
      return this.db.runAsync('ROLLBACK').then(() => {
        throw e;
      });
    });
  }

  close() {
    return this.db.closeAsync();
  }

  getName() {
    return this.NAME;
  }
}
