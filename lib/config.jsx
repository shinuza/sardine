import { stat } from 'fs';
import { resolve } from 'path';

import _ from 'lodash';
import Promise from 'bluebird';

import { MissingConfiguration, UndefinedConfiguration } from '../lib/errors';

const SARDINE_CONFIG = 'sardineConfig.js';
const CONFIG_TEMPLATE = `module.exports = {
  directory:  'migrations',
  tableName:  'sardine_migrations',
  driver:     'pg',
  connection: {
    host:     'localhost',
    user:     'postgres',
    password: 'postgres',
    database: 'postgres'
  }
};
`;

function checkKeys(conf, requestedKeys) {
  const filteredKeys = _.keys(_.pick(conf, ...requestedKeys));
  const missingKeys = _.difference(requestedKeys, filteredKeys);

  if(!_.isEqual(filteredKeys, requestedKeys)) {
    throw new UndefinedConfiguration(`Entries "${missingKeys.join(', ')}" are missing in "${SARDINE_CONFIG}"`);
  }
}

function config(keys) {
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

export default {
  CONFIG_TEMPLATE,
  SARDINE_CONFIG,
  checkKeys,
  config,
};
