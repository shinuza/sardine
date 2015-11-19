import Sardine from '../../lib';
import { EmptyBatchError, QueryError } from '../../lib/errors';
import { showError, showInfo, showVerbose } from '../util';

export default function update(config, command) {
  const sardine = new Sardine(config);

  sardine.migrations.on('applyOne', (m) => {
    showInfo(`Applying "${m.name}"`);
  });

  if(command.parent.verbose) {
    sardine.migrations.on('stepApplied', (s) => {
      showVerbose(`Running "${s}"`);
    });
  }

  return sardine.up()
    .catch(QueryError, (e) => showError(e.message))
    .catch(EmptyBatchError, () => showInfo('Everything already up to date'));
}
