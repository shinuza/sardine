var wrapper = require('../lib/db/types.jsx').TypeWrapper;

export function insert(db, values) {
  const type = new wrapper(db.getName());
  return db.query('INSERT INTO sardine_migrations (name, applied, migration_time, checksum) VALUES (?, ?, ?, ?)',
    [
      type.String(values.name),
      type.Boolean(values.applied),
      type.DateTime(values.migration_time),
      type.String(values.checksum),
    ]);
}

export function select(db) {
  return db.query('SELECT * FROM sardine_migrations');
}

export function count(db) {
  return db.query('SELECT COUNT(*) AS count FROM sardine_migrations')
    .then(([res]) => res.count);
}
