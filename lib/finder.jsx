import { basename, resolve } from 'path';
import fs from 'fs';

import Promise from 'bluebird';

import util from './util';

Promise.promisifyAll(fs);

class Finder {

  directory = null;

  constructor(directory) {
    this.directory = directory;
  }

  discover() {
    return fs.readdirAsync(this.directory).then((dirs) =>
      Promise.all(
        dirs.map((dir) => this.read(resolve(this.directory, dir)))
      ));
  }

  read(path) {
    const name = basename(path);
    return Promise
      .all([
        fs.readdirAsync(resolve(path, 'up')).then((up) =>
          Promise.all(
            up.map((filename) => this.readFile(resolve(path, 'up'), filename)))
        ),
        fs.readdirAsync(resolve(path, 'down')).then((down) =>
          Promise.all(
            down.map((filename) => this.readFile(resolve(path, 'down'), filename)))
        ),
      ])
      .then((migrations) =>
        Promise.all(migrations).then(([up, down]) => {
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
        })
      );
  }

  readFile(path, filename) {
    return fs.readFileAsync(resolve(path, filename))
      .then((contents) => ({ filename, contents, checksum: util.checksum(filename, contents) }));
  }

  directionChecksum(files) {
    let sum = '';
    files.forEach((file) => {
      sum = sum + util.checksum(file.filename, file.contents.toString());
    });

    return sum === '' ? sum : util.checksum(sum);
  }
}

export default Finder;
