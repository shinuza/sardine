import { showError, showInfo, showWarning } from '../util';
import Migrations from '../../lib/migrations';
import { SARDINE_CONFIG } from '../../lib/config';

export default function init(config, cwd) {
  const migrations = new Migrations();

  migrations.on('init:noop', () => showWarning('Already initialized'));
  migrations.on('init:success', () => showInfo(`Initialized current directory with ${SARDINE_CONFIG}`));

  return migrations
    .init(config, cwd)
    .catch((e) => {
      showError(e.stack);
    })
    .then(() => migrations.destroy());
}
