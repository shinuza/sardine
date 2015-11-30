import { config } from '../../lib/config';
import { showError } from '../util';

function command(fn, configKeys) {
  return function commandWrapper(...args) {
    config(configKeys)
      .then((c) => fn(c, ...args))
      .catch((e) => {
        showError(e.stack || e.message);
        process.exit(1);
      });
  };
}

const init = () => require('./init')(config(), process.cwd());

const create = command(require('./create'), ['directory']);

const current = command(require('./current'), ['directory']);

const rollback = command(require('./rollback'), ['directory']);

const step = command(require('./step'), ['directory']);

const update = command(require('./update'), ['directory']);

export default {
  init,
  create,
  current,
  rollback,
  step,
  update,
};
