import pgp from 'pg-promise';

import db from '../../lib/db';
import Migrations from '../../lib/migrations';
import { UndefinedConfiguration } from '../../lib/errors';
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
        .getRollbackBatch(!command.all)
        .then(({ batch, recorded }) => {
          if(!batch.length) {
            return showInfo('Already at the earliest revision');
          }

          return migrations.down({ batch, recorded });
        });
    })
    .catch((e) => {
      showError(e.stack || e.message);
      process.exitCode = 1;
    })
    .then(pgp.end);
}

export default rollback;
