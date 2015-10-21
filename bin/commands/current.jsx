import colors from 'colors/safe';

import db from '../../lib/db';
import Migrations from '../../lib/migrations';
import { current as currentFilter } from '../../lib/filters';

export default function current(config) {
  const { directory } = config;
  return (new Migrations(directory))
    .discover()
    .then((discovered) =>
      db.findMigrations().then((recorded) => {
        const cur = currentFilter(discovered, recorded);
        const lines = discovered.map((m) => {
          let start = ' ';
          let out = ` ${m.name}`;
          if(cur.name === m.name) {
            start = '*';
            out = colors.green(out);
          }
          out = start + out;
          return out;
        });
        console.log(lines.join('\n'));
      }));
}
