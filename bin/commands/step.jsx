import { writeFile } from 'fs';
import { resolve } from 'path';

import Promise from 'bluebird';
import _ from 'lodash';

import Migrations from '../../lib/migrations';
import { twoDigits } from '../../lib/util';
import { showError, showInfo } from '../util';

const writeFileAsync = Promise.promisify(writeFile);

export default function step(config, migrationName, suffixes) {
  const { directory } = config;
  return (new Migrations(directory))
    .discover()
    .then((discovered) => {
      const target = _.find(discovered, (m) => _.contains(m.name, migrationName));

      if(!target) {
        return showError(`Migration "${migrationName}" not found`);
      }

      return Promise.all(suffixes.map((suffix, index) => {
        const resolveMig = resolve.bind(null, directory, target.name);
        return Promise.all(
          ['up', 'down'].map((direction) => {
            const path = resolveMig(direction, `${twoDigits(target.steps + index + 1)}_${suffix}.sql`);
            showInfo(`Created ${path}`);
            return writeFileAsync(path, '');
          })
        );
      }));
    });
}

export default step;
