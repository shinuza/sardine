import { stat } from 'fs';
import { resolve } from 'path';

import _ from 'lodash';
import Promise from 'bluebird';

import { MissingConfiguration, UndefinedConfiguration } from '../lib/errors';

export const SARDINE_CONFIG = 'sardineConfig.js';

export function checkKeys(conf, requestedKeys) {
  const filteredKeys = _.keys(_.pick(conf, ...requestedKeys));
  const missingKeys = _.difference(requestedKeys, filteredKeys);

  if(!_.isEqual(filteredKeys, requestedKeys)) {
    throw new UndefinedConfiguration(`Entries "${missingKeys.join(', ')}" are missing in "${SARDINE_CONFIG}"`);
  }
}

export function config(keys) {
  const configPath = resolve(process.cwd(), SARDINE_CONFIG);
  return new Promise((res, rej) => {
    stat(configPath, (err) => {
      if(err) {
        const error = new MissingConfiguration(`${SARDINE_CONFIG} not found in current directory`);
        return rej(error);
      }
      const conf = require(configPath);
      if(keys) {
        checkKeys(conf, keys);
      }
      res(conf);
    });
  });
}
