import Sardine from '../../lib';
import { showInfo } from '../util';

export default function step(config, migrationName, suffixes) {
  const sardine = new Sardine(config);

  sardine.migrations.on('fileCreated:step', (path) => showInfo(`Created ${path}`));

  return sardine.step(migrationName, suffixes);
}

export default step;
