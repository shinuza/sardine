import Migrations from '../../lib/migrations';
import { showInfo, showVerbose } from '../util';

export default function rollback(config, command) {
  const { directory } = config;
  const migrations = new Migrations(directory);

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
}
