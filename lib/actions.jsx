import { join, resolve } from 'path';
import fs from 'fs';

import _ from 'lodash';
import Promise from 'bluebird';

import filters from './filters';
import { twoDigits } from './util';
import { MigrationNotFound, MissingConfiguration } from './errors';
import { snake } from './date';
import { SARDINE_CONFIG, CONFIG_TEMPLATE } from './config';

Promise.promisifyAll(fs);

function init(config, cwd) {
  return config
    .then(() => false)
    .catch(MissingConfiguration, () => {
      const path = resolve(cwd, SARDINE_CONFIG);
      return fs.writeFileAsync(path, CONFIG_TEMPLATE)
        .then(() => true);
    });
}

function create(date, suffix) {
  const snakeDate = snake(date);
  const rootDir = `${snakeDate}_${suffix}`;

  return {
    rootDir,
    up: join(rootDir, 'up'),
    down: join(rootDir, 'down'),
  };
}

function step(discovered, migrationName, suffixes) {
  const paths = [];
  const target = _.find(discovered, (m) => _.contains(m.name, migrationName));

  if(!target) {
    throw new MigrationNotFound(`Migration "${migrationName}" not found`);
  }

  ['up', 'down'].forEach((direction) => {
    suffixes.forEach((suffix, index) => {
      const filename = `${twoDigits(target.steps + index + 1)}_${suffix}.sql`;
      paths.push(`${join(target.name, direction, filename)}`);
    });
  });

  return paths;
}

function _isCurrent(currentMigration, name) {
  if(currentMigration) {
    return currentMigration.name === name;
  }
  return true;
}

function state(discovered, recorded) {
  discovered = [{ name: 'initial', initial: true, current: true }].concat(discovered);
  const currentMigration = filters.current(discovered, recorded);

  return discovered.map(({ name, initial }) => {
    return {
      name,
      current: _isCurrent(currentMigration, name),
      initial: Boolean(initial),
    };
  });
}

export default {
  create,
  init,
  step,
  state,
};