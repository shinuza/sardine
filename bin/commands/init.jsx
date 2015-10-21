import { writeFile } from 'fs';
import { resolve } from 'path';

import Promise from 'bluebird';

import { showError, showInfo } from '../util';
import { MissingConfiguration } from '../../lib/errors';
import { SARDINE_CONFIG, config } from '../../lib/config';

const writeFileAsync = Promise.promisify(writeFile);

const TEMPLATE = `module.exports = {
  directory: 'migrations',
  tableName: 'sardine_migrations',
  connection: {
    host:     'localhost',
    user:     'postgres',
    password: 'postgres',
    database: 'postgres'
  }
};
`;

function init() {
  config()
    .then(() => showInfo('Already initialized'))
    .catch(MissingConfiguration, () => {
      const path = resolve(process.cwd(), SARDINE_CONFIG);
      return writeFileAsync(path, TEMPLATE)
        .then(() => showInfo(`Initialized current directory with ${SARDINE_CONFIG}`));
    })
    .catch((e) => {
      showError(e.stack);
    });
}

export default init;
