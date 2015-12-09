import path from 'path';

const config = {
  directory: path.resolve(__dirname, '..', 'sandbox', 'migrations'),
  tableName: 'test_sardine_migrations',
  driver: 'sqlite3',
  connection: {
    path: path.resolve(__dirname, '../sandbox/test.sqlite'),
  },
};

export default config;
