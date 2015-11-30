import Sardine from '../../lib';
import { events } from '../../lib/events';

function create(config, suffix, command) {
  const sardine = new Sardine(config);

  sardine.on(
    events.CREATED_MIGRATION_DIRECTORY,
    sardine.onCreatedMigrationDirectory);

  if(command.parent.verbose) {
    sardine.on(
      events.CREATED_DIRECTION_DIRECTORY,
      sardine.onCratedDirectionDirectory);
  }

  return sardine.create(new Date(), suffix);
}

export default create;
