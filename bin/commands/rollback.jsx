import Sardine from '../../lib';
import { EmptyBatchError, QueryError } from '../../lib/errors';
import { showError, showInfo } from '../util';
import { events } from '../../lib/events';

function rollback(config, command) {
  const sardine = new Sardine(config);

  sardine.on(events.APPLY_MIGRATION, sardine.onApplyMigrationDown);

  if(command.parent.verbose) {
    sardine.on(events.STEP_APPLIED, sardine.onStepApplied);
  }

  return sardine.down(!command.all)
    .catch(QueryError, (e) => showError(e.message))
    .catch(EmptyBatchError, () => showInfo('Already at the earliest revision'));
}

export default rollback;
