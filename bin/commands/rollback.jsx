import Migrations from '../../lib/migrations';
import { EmptyBatchError } from '../../lib/errors';
import { showInfo, showVerbose } from '../util';

export default function rollback(config, command) {
  const migrations = new Migrations(config);

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
    .then((b) => migrations.down(b))
    .catch(EmptyBatchError, () => showInfo('Already at the earliest revision'))
    .then(() => migrations.destroy());
}
