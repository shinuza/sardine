import { resolve } from 'path';

import mkdirp from 'mkdirp';

import Migrations from '../../lib/migrations';
import errors from '../../lib/errors';
import { showInfo, showVerbose } from '../util';

export default function create(config, suffix, command) {
  const { directory } = config;
  const migrations = new Migrations(directory);

  return Promise.all([
    migrations.getUpdateBatch(),
    migrations.create(new Date(), suffix),
  ])
    .then(([{ batch }, paths]) => {
      if(!batch.length) {
        mkdirp.sync(resolve(directory, paths.up));
        mkdirp.sync(resolve(directory, paths.down));

        showInfo(`Created ${paths.rootDir}`);
        if(command.parent.verbose) {
          showVerbose(`Created ${paths.up}`);
          showVerbose(`Created ${paths.down}`);
        }
        return;
      }

      throw new errors.PendingMigrations(
        'You can only edit one new migration at the time, run "sardine up" before creating a new one');
    });
}
