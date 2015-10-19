import { stat } from 'fs';
import { resolve } from 'path';

import Promise from 'bluebird';
import colors from 'colors/safe';

import { MissingConfiguration } from '../lib/errors';

const SARDINE_CONFIG = 'sardineConfig.js';

function config() {
  const configPath = resolve(process.cwd(), SARDINE_CONFIG);
  return new Promise((res, rej) => {
    stat(configPath, (err, stats) => {
      if(err) {
        const error = new MissingConfiguration(`${SARDINE_CONFIG} not found in current directory`);
        return rej(error);
      }
      res(require(configPath));
    })
  });
}

function showError(message) {
  console.error(colors.red('ERROR:') + ' ' + message);
}

function showInfo(message) {
  console.info(colors.green('INFO:') + ' ' + message);
}

export default { config, showError, showInfo };
