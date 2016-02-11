import path from 'path';

import _ from 'lodash';

import { config } from '../../lib/config';
import { showError } from '../util';

function command(fn) {
  return function commandWrapper(...args) {
    const options = _.last(args);
    const configPath = path.resolve(process.cwd(), options.parent.config);

    config(configPath)
      .then((c) => fn(c, ...args))
      .catch((e) => {
        showError(e.stack || e.message);
        process.exit(1);
      });
  };
}

const init = () => require('./init')(process.cwd());

const compile = command(require('./compile'));

const create = command(require('./create'));

const current = command(require('./current'));

const rollback = command(require('./rollback'));

const step = command(require('./step'));

const update = command(require('./update'));

export default {
  init,
  compile,
  create,
  current,
  rollback,
  step,
  update,
};
