import { identity } from 'lodash';
import { green } from 'colors/safe';

import * as db from '../../lib/db';
import Migrations from '../../lib/migrations';

export default function current(config) {
  const { directory } = config;
  const migrations = new Migrations(directory);

  return Promise.all([migrations.discover(), db.findMigrations()]).then(([discovered, recorded]) => {
    const lines = migrations
      .state(discovered, recorded)
      .map((m) => `${m.current ? '*' : ' '} ${[identity, green][m.current + 0](m.name)}`);

    console.log(lines.join('\n'));
  });
}
