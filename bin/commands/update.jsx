import Migrations from '../../lib/migrations';
import { EmptyBatchError } from '../../lib/errors';
import { showInfo, showVerbose } from '../util';

export default function update(config, command) {
  const { directory } = config;
  const migrations = new Migrations(directory);

  migrations.on('applyOne', (m) => {
    showInfo(`Applying "${m.name}"`);
  });

  migrations.on('step', (s) => {
    if(command.parent.verbose) {
      showVerbose(`Running "${s}"`);
    }
  });

  return migrations
    .getUpdateBatch()
    .then(migrations.up.bind(migrations))
    .catch(EmptyBatchError, () => showInfo('Everything already up to date'));
}
