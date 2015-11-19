import Sardine from '../../lib';
import { EmptyBatchError, QueryError } from '../../lib/errors';
import { showError, showInfo, showVerbose } from '../util';

export default function rollback(config, command) {
  const sardine = new Sardine(config);

  sardine.migrations.on('applyOne', (m) => {
    showInfo(`Rolling back "${m.name}"`);
  });

  sardine.migrations.on('step', (s) => {
    if(command.parent.verbose) {
      showVerbose(`Running "${s}"`);
    }
  });

  return sardine.down(!command.all)
    .catch(QueryError, (e) => showError(e.message))
    .catch(EmptyBatchError, () => showInfo('Already at the earliest revision'));
}
