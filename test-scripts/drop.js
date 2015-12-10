import assert from 'assert';

import { config, pgRawQuery } from './db';

function drop() {
  console.log('Dropping postgres test database');
  pgRawQuery(`DROP DATABASE ${config.connection.database}`, assert.ifError);
}

export default drop;
