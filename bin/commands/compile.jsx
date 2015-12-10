import { writeFile } from 'fs';
import { resolve } from 'path';

import Promise from 'bluebird';
import mkdirp from 'mkdirp';

import Sardine from '../../lib';
import { showError, showInfo } from '../util';
import { MigrationNotFound } from '../../lib/errors';

const writeFileAsync = Promise.promisify(writeFile);
const mkdirpAsync = Promise.promisify(mkdirp);

function onFileDumped(direction, filename) {
  return () => showInfo(`Dumped "${direction}" to "${filename}"`);
}

function compile(config, suffix, command) {
  const sardine = new Sardine(config);

  return sardine.compile(suffix)
    .then(({ migration, files }) => {
      const { dir } = command;
      const { name } = migration;
      const { up, down } = files;

      const targetDir = resolve(dir, name);
      const upPath = resolve(targetDir, 'up.sql');
      const downPath = resolve(targetDir, 'down.sql');

      return mkdirpAsync(targetDir).then(
        () => Promise.all([
          writeFileAsync(upPath, up).then(onFileDumped('up', upPath)),
          writeFileAsync(downPath, down).then(onFileDumped('down', downPath)),
        ]
      ));
    })
    .catch(MigrationNotFound, (e) => showError(e.message));
}

export default compile;
