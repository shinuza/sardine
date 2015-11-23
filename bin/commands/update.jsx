import Sardine from '../../lib';
import { EmptyBatchError, QueryError } from '../../lib/errors';
import { showError, showInfo } from '../util';
import { events } from '../../lib/events';

export default function update(config, command) {
  const sardine = new Sardine(config);

  sardine.on(events.APPLY_MIGRATION, sardine.onApplyMigrationUp);

  if(command.parent.verbose) {
    sardine.on(events.STEP_APPLIED, sardine.onStepApplied);
  }

  return sardine.up()
    .catch(QueryError, (e) => showError(e.message))
    .catch(EmptyBatchError, () => showInfo('Everything already up to date'));
}
