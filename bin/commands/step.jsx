import { writeFile } from 'fs';
import { resolve } from 'path';

import Promise from 'bluebird';

import Migrations from '../../lib/migrations';
import { showInfo } from '../util';

const writeFileAsync = Promise.promisify(writeFile);

export default function step(config, migrationName, suffixes) {
  const { directory } = config;
  const migrations = new Migrations(config);

  return migrations
    .discover()
    .then(() => {
      const paths = migrations.step(migrationName, suffixes);

      return Promise.all(
        paths.map((path) => {
          showInfo(`Created ${path}`);
          return writeFileAsync(resolve(directory, path), '');
        }));
    });
}

export default step;
