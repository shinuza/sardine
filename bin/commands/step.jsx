import Sardine from '../../lib';
import { events } from '../../lib/events';
import { showError } from '../util';
import { MigrationNotFound } from '../../lib/errors';

function step(config, migrationName, suffixes) {
  const sardine = new Sardine(config);

  sardine.on(events.STEP_FILE_CREATED, sardine.onStepFileCreated);

  return sardine
    .step(migrationName, suffixes)
    .catch(MigrationNotFound, (e) => showError(e.message));
}

export default step;
