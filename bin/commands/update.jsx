import db from '../../lib/db';
import { UndefinedConfiguration } from '../../lib/errors';
import { update as updateFilter } from '../../lib/filters';
import { applyMigrations, discoverMigrations } from '../../lib/migrations';
import { config } from '../../lib/config';
import { showError, showInfo } from '../util';

function update() {
  config()
    .then((conf) => {
      const { directory } = conf;
      if(!directory) {
        throw new UndefinedConfiguration('directory');
      }

      return directory;
    })
    .then((dir) => {
      discoverMigrations(dir)
        .then((discoveredMigrations) =>
          db.findMigrations().then((recordedMigrations) => {
            const batch = discoveredMigrations.filter(updateFilter(recordedMigrations));
            return applyMigrations({ direction: 'up', migrations: batch, recordedMigrations });
          })
        )
        .then(() => process.exit(0))
        .catch((e) => {
          showError(e.stack || e.message);
          process.exit(1);
        });
    })
}

export default update;
