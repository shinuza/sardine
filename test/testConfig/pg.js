import path from 'path';

module.exports = {
  directory: path.resolve(__dirname, '..', 'sandbox', 'migrations'),
  tableName: 'test_sardine_migrations',
  driver: 'pg',
  connection: {
    host: 'localhost',
    user: 'postgres',
    password: '',
    database: 'test_sardine',
  },
};
