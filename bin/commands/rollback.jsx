import db from '../../lib/db';
import { UndefinedConfiguration } from '../../lib/errors';
import { rollback as rollbackFilter } from '../../lib/filters';
import Migrations from '../../lib/migrations';
import { config } from '../../lib/config';
import { showError, showInfo, showVerbose } from '../util';

function rollback(command) {
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

      migrations.on('applyOne', (m) => {
        showInfo(`Rolling back "${m.name}"`);
      });

      migrations.on('step', (s) => {
        if(command.parent.verbose) {
          showVerbose(`Running "${s}"`);
        }
      });

      return migrations
        .discover()
        .then((discovered) =>
          db.findLastAppliedMigrations().then((recorded) => {
            const batch = discovered.filter(rollbackFilter(recorded));

            if(!batch.length) {
              showInfo('Already at the earliest revision');
            }

            return migrations.down({ batch, recorded });
          }));
    })
    .then(() => process.exit(0))
    .catch((e) => {
      showError(e.stack || e.message);
      process.exit(1);
    })
}

export default rollback;
