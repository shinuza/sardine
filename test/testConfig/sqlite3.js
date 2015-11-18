import path from 'path';

module.exports = {
  directory: path.resolve(__dirname, '..', 'sandbox', 'migrations'),
  tableName: 'test_sardine_migrations',
  driver: 'sqlite3',
  connection: {
    path: ':memory:',
  },
};
