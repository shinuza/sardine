import { join, resolve } from 'path';
import fs from 'fs';

import Promise from 'bluebird';
import glob from 'glob';

import util from './util';

const readdirAsync = Promise.promisify(fs.readdir);
const readFileAsync = Promise.promisify(fs.readFile);
const statAsync = Promise.promisify(fs.stat);

class Finder {

  directory = null;

  constructor(directory) {
    this.directory = directory;
  }

  discover() {
    return readdirAsync(this.directory)
      .filter((entry) =>
        statAsync(resolve(this.directory, entry)).then((stat) => stat.isDirectory())
      )
      .then((dirs) => Promise.all(dirs.map(this.readMigration, this)));
  }

  readMigration(path) {
    return this.readDirections(path).then((migrations) => this.inspect(migrations, path));
  }

  readDirections(path) {
    const up = glob.sync(join(path, 'up', '**', '*.sql'), { cwd: this.directory });
    const down = glob.sync(join(path, 'down', '**', '*.sql'), { cwd: this.directory });

    return Promise.all([
      Promise.all(up.map(this.readFile, this)),
      Promise.all(down.map(this.readFile, this)),
    ]);
  }

  readFile(filename) {
    return readFileAsync(resolve(this.directory, filename))
      .then((contents) => ({ filename, contents, checksum: util.checksum(filename, contents) }));
  }

  inspect(migrations, name) {
    return Promise.all(migrations).then(([up, down]) => {
      util.checkIntegrity(up, down, name);

      const upSum = this.directionChecksum(up);
      const downSum = this.directionChecksum(down);

      return {
        name,
        up: { files: up, checksum: upSum },
        down: { files: down, checksum: downSum },
        steps: up.length,
        checksum: util.checksum(upSum, downSum),
      };
    });
  }

  directionChecksum(files) {
    const sum = files.reduce((prev, curr) => prev + util.checksum(curr.filename, curr.contents.toString()), '');
    return sum === '' ? sum : util.checksum(sum);
  }
}

export default Finder;
