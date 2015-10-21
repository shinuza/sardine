import pgp from 'pg-promise';

import { config } from '../../lib/config';
import { showError } from '../util';

function command(fn, configKeys) {
  return function commandWrapper(...args) {
    config(configKeys)
      .then((c) => fn(c, ...args))
      .catch((e) => {
        showError(e.stack || e.message);
        process.exitCode = 1;
      })
      .then(pgp.end);
  };
}

export const create = command(require('./create'), ['directory']);

export const current = command(require('./current'), ['directory']);

export const init = require('./init');

export const rollback = command(require('./rollback'), ['directory']);

export const step = command(require('./step'), ['directory']);

export const update = command(require('./update'), ['directory']);
