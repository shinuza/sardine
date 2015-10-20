import Promise from 'bluebird';
import { readFile } from 'fs';
import { resolve } from 'path';
import pgp from 'pg-promise';

import { config } from './config';

const readFileAsync = Promise.promisify(readFile);

function getDb() {
  return config()
    .then((conf) => {
      const db = pgp().call(null, conf.connection);
      return createMigrationTable(db)
        .then(() => ({ db, conf }));
    });
}

function createMigrationTable(db) {
    const path = resolve(__dirname, 'sql', 'create_table.sql');
    // TODO: Memoize this call
    return readFileAsync(path)
      .then((createScript) => db.query(createScript.toString()))
      .catch((e) => {
        throw e;
      });
}

function findMigrations() {
  return getDb().then(({ db, conf }) =>
    db.query(`SELECT * FROM ${conf.tableName} ORDER BY name`));
}

function findLastAppliedMigrations(limit = 1) {
  return getDb().then(({ db, conf }) => {
    let query = `SELECT * FROM ${conf.tableName} WHERE applied = true ORDER BY migration_time DESC`;
    if(limit) {
      query = query + ` LIMIT ${limit}`;
    }
    return db.query(query);
  });
}

function recordMigration(migration) {
  return getDb().then(({ db, conf }) =>
    db.query(`INSERT INTO ${conf.tableName} ` + '(name, applied, migration_time, checksum) VALUES (${name}, ${applied}, now(), ${checksum})', {
      name: migration.name,
      applied: true,
      checksum: migration.checksum,
    }));
}

function updateMigration(migration, direction) {
  return getDb().then(({ db, conf }) =>
    db.query(`UPDATE ${conf.tableName} ` + 'SET applied = ${applied} WHERE name = ${name}', {
      table: conf.tableName,
      applied: direction === 'up',
      name: migration.name,
    }));
}

export default { getDb, findMigrations, findLastAppliedMigrations, recordMigration, updateMigration };
