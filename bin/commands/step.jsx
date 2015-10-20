import { writeFile } from 'fs';
import { resolve } from 'path';

import Promise from 'bluebird';
import _ from 'lodash';

import Migrations from '../../lib/migrations';
import { UndefinedConfiguration } from '../../lib/errors';
import { config } from '../../lib/config';
import { twoDigits } from '../../lib/util';
import { showError, showInfo } from '../util';

const writeFileAsync = Promise.promisify(writeFile);

function step(migrationName, suffixes, command) {
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
      .then((discovered) => {
        const target = _.find(discovered, (m) => _.contains(m.name, migrationName));

        if(!target) {
          return showError(`Migration "${migration}" not found`);
        }

        return Promise.all(suffixes.map((suffix, index) => {
          const resolveMig = resolve.bind(null, dir, target.name);
          return Promise.all(
            ['up', 'down'].map((direction) => {
              const path = resolveMig(direction, `${twoDigits(target.steps + index + 1)}_${suffix}.sql`);
              showInfo(`Created ${path}`);
              return writeFileAsync(path, '');
            })
          );
        }));
      });
    })
    .then(() => process.exit(0))
    .catch((e) => {
      showError(e.stack || e.message);
      process.exit(1);
    })
}

export default step;
