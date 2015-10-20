import db from '../../lib/db';
import { UndefinedConfiguration } from '../../lib/errors';
import { update as updateFilter } from '../../lib/filters';
import Migrations from '../../lib/migrations';
import { config } from '../../lib/config';
import { showError, showInfo, showVerbose } from '../util';

function update(command) {
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
        showInfo(`Applying "${m.name}"`);
      });

      migrations.on('step', (s) => {
        if(command.parent.verbose) {
          showVerbose(`Running "${s}"`);
        }
      });

      return migrations
        .discover()
        .then((discovered) =>
          db.findMigrations().then((recorded) => {
            const batch = discovered.filter(updateFilter(recorded));

            if(!batch.length) {
              return showInfo('Everything already up to date');
            }

            return migrations.up({ batch, recorded });
          }))
    })
    .then(() => process.exit(0))
    .catch((e) => {
      showError(e.stack || e.message);
      process.exit(1);
    });
}

export default update;
