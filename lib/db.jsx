import pgp from 'pg-promise';

import { config } from './config';

const CREATE_MIGRATION_SCRIPT = `
CREATE TABLE IF NOT EXISTS sardine_migrations
(
  id serial NOT NULL,
  name character varying(255),
  applied boolean,
  migration_time timestamp without time zone,
  checksum text,
  CONSTRAINT sardine_migrations_pkey PRIMARY KEY (id)
);`;

export function createMigrationTable(db) {
  return db.query(CREATE_MIGRATION_SCRIPT);
}

export function getDb() {
  return config()
    .then((conf) => {
      const db = pgp().call(null, conf.connection);
      return createMigrationTable(db)
        .then(() => ({ db, conf }));
    });
}

export function findMigrations() {
  return getDb().then(({ db, conf }) =>
    db.query(`SELECT * FROM ${conf.tableName} ORDER BY name`));
}

export function findLastAppliedMigrations(limit) {
  return getDb().then(({ db, conf }) => {
    let query = `SELECT * FROM ${conf.tableName} WHERE applied = true ORDER BY migration_time DESC`;
    if(limit) {
      query = query + ` LIMIT 1`;
    }
    return db.query(query);
  });
}

export function recordMigration(migration) {
  return getDb().then(({ db, conf }) =>
    db.query(`INSERT INTO ${conf.tableName} ` +
        '(name, applied, migration_time, checksum) VALUES (${name}, ${applied}, now(), ${checksum})', {
          name: migration.name,
          applied: true,
          checksum: migration.checksum,
        }));
}

export function updateMigration(migration, direction) {
  return getDb().then(({ db, conf }) =>
    db.query(`UPDATE ${conf.tableName} ` +
        'SET applied = ${applied} WHERE name = ${name}', {
          table: conf.tableName,
          applied: direction === 'up',
          name: migration.name,
        }));
}
