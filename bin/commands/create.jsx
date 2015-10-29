import Sardine from '../../lib';

import { showInfo, showVerbose } from '../util';

export default function create(config, suffix, command) {
  const sardine = new Sardine(config);

  sardine.migrations.on('directoryCreated:migration', (dir) => showInfo(`Created ${dir}`));

  if(command.parent.verbose) {
    sardine.migrations.on('directoryCreated:direction', (dir) => showVerbose(`Created ${dir}`));
  }

  return sardine.create(new Date(), suffix);
}
