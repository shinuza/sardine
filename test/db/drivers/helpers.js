var TypeWrapper = require('../../../lib/db/types.jsx');

export function insert(db, values) {
  const type = new TypeWrapper(db.getName());
  return db.query(`INSERT INTO ${db.configuration.tableName} (name, applied, migration_time, checksum) VALUES (?, ?, ?, ?)`,
    [
      type.String(values.name).toSQL(),
      type.Boolean(values.applied).toSQL(),
      type.DateTime(values.migration_time).toSQL(),
      type.String(values.checksum).toSQL(),
    ]);
}

export function select(db) {
  return db.query(`SELECT * FROM ${db.configuration.tableName}`);
}

export function count(db) {
  return db.query(`SELECT COUNT(*) AS count FROM ${db.configuration.tableName}`)
    .then(([res]) => res.count);
}

export function drop(db) {
  return db.query(`DROP TABLE ${db.configuration.tableName}`)
}
