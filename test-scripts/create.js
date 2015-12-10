import assert from 'assert';

import { config, pgRawQuery } from './db';

function create() {
  console.log('Creating postgres test database');
  pgRawQuery(`CREATE DATABASE ${config.connection.database}`, assert.ifError);
}

export default create;
