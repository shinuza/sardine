import { join, resolve } from 'path';
import fs from 'fs';

import Promise from 'bluebird';

import filters from './filters';
import { getMigration, twoDigits } from './util';
import { MissingConfiguration } from './errors';
import { snake } from './date';
import { SARDINE_CONFIG, CONFIG_TEMPLATE, config } from './config';

Promise.promisifyAll(fs);

function init(cwd) {
  return config(cwd)
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
  const target = getMigration(discovered, migrationName);

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
