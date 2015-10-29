import Sardine from '../../lib';
import { EmptyBatchError } from '../../lib/errors';
import { showInfo, showVerbose } from '../util';

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
    .catch(EmptyBatchError, () => showInfo('Everything already up to date'));
}
