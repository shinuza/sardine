import colors from 'colors/safe';
import pgp from 'pg-promise';

import db from '../../lib/db';
import Migrations from '../../lib/migrations';
import { UndefinedConfiguration } from '../../lib/errors';
import { current as currentFilter } from '../../lib/filters';
import { config } from '../../lib/config';
import { showError, showInfo } from '../util';

function current(command) {
  config()
    .then((conf) => {
      const { directory } = conf;
      if(!directory) {
        throw new UndefinedConfiguration('directory');
      }
      return directory;
    })
    .then((dir) => {
      const migrations = new Migrations(dir);

      return migrations
        .discover()
        .then((discovered) =>
          db.findMigrations().then((recorded) => {
            const current = currentFilter(discovered, recorded);
            const lines = discovered.map((m) => {
              let start = ' ';
              let out = ` ${m.name}`;
              if(current.name === m.name) {
                start = '*';
                out = colors.green(out);
              }
              out = start + out;
              return out;
            });
            console.log(lines.join('\n'));
          }));
    })
    .catch((e) => {
      showError(e.stack || e.message);
      process.exitCode = 1;
    })
    .then(pgp.end);
}

export default current;
