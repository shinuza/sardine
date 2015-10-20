import db from '../../lib/db';
import { UndefinedConfiguration } from '../../lib/errors';
import { rollback as rollbackFilter } from '../../lib/filters';
import Migrations from '../../lib/migrations';
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
      const migrations = new Migrations(dir);

      return migrations
        .discover()
        .then((discovered) =>
          db.findLastAppliedMigrations().then((recorded) => {
            const batch = discovered.filter(rollbackFilter(recorded));
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
