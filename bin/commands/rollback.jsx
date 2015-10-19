import db from '../../lib/db';
import { UndefinedConfiguration } from '../../lib/errors';
import { rollback as rollbackFilter } from '../../lib/filters';
import { applyMigrations, discoverMigrations } from '../../lib/migrations';
import { config } from '../../lib/config';
import { showError, showInfo } from '../util';

function rollback() {
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
          db.findLastAppliedMigration().then((migration) => {
            const batch = discoveredMigrations.filter(rollbackFilter(migration));
            return applyMigrations({ direction: 'down', migrations: batch, recordedMigrations: [migration] });
          })
        )
        .then(() => process.exit(0))
        .catch((e) => {
          showError(e.stack || e.message);
          process.exit(1);
        });
    })
}

export default rollback;
