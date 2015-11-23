import Sardine from '../../lib';
import { events } from '../../lib/events';

export default function step(config, migrationName, suffixes) {
  const sardine = new Sardine(config);

  sardine.on(events.STEP_FILE_CREATED, sardine.onStepFileCreated);

  return sardine.step(migrationName, suffixes);
}

export default step;
