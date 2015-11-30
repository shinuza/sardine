import path from 'path';

const config = {
  directory: path.resolve(__dirname, '..', 'sandbox', 'migrations'),
  tableName: 'test_sardine_migrations',
  driver: 'sqlite3',
  connection: {
    path: ':memory:',
  },
};

export default config;
