import { resolve } from 'path';

import mkdirp from 'mkdirp';

import Migrations from '../../lib/migrations';
import errors from '../../lib/errors';
import { showInfo, showVerbose } from '../util';

export default function create(config, suffix, command) {
  const { directory } = config;
  const migrations = new Migrations(config);

  return migrations.getUpdateBatch()
    .then(({ batch }) => {
      if(batch.length) {
        throw new errors.PendingMigrations(
          'You can only edit one new migration at the time, run "sardine up" before creating a new one');
      }

      const paths = migrations.create(new Date(), suffix);
      mkdirp.sync(resolve(directory, paths.up));
      mkdirp.sync(resolve(directory, paths.down));

      showInfo(`Created ${paths.rootDir}`);
      if(command.parent.verbose) {
        showVerbose(`Created ${paths.up}`);
        showVerbose(`Created ${paths.down}`);
      }
    }).then(() => migrations.destroy());
}
