import { writeFile } from 'fs';
import { resolve } from 'path';

import co from 'co';
import mkdirp from 'mkdirp';
import Promise from 'bluebird';

import Migrations from './migrations';
import errors from './errors';

const writeFileAsync = Promise.promisify(writeFile);

export default class Sardine {
  constructor(config) {
    this.config = config;
    this.migrations = new Migrations(config);
  }

  up() {
    return this.migrations
      .getUpdateBatch()
      .then(this.migrations.up)
      .finally(this.migrations.destroy);
  }

  down(all) {
    return this.migrations
      .getRollbackBatch(all)
      .then(this.migrations.down)
      .finally(this.migrations.destroy);
  }

  create(date, suffix) {
    return this.migrations.getUpdateBatch()
      .then(({ batch }) => {
        if(batch.length) {
          throw new errors.PendingMigrations(
            'You can only edit one new migration at the time, run "sardine up" before creating a new one');
        }
      })
      .then(() => {
        const paths = this.migrations.create(date, suffix);
        const { directory } = this.config;

        this.migrations.emit('directoryCreated:migration', paths.rootDir);
        mkdirp.sync(resolve(directory));

        this.migrations.emit('directoryCreated:direction', paths.up);
        mkdirp.sync(resolve(directory, paths.up));

        this.migrations.emit('directoryCreated:direction', paths.down);
        mkdirp.sync(resolve(directory, paths.down));

      }).finally(this.migrations.destroy);
  }

  step(migrationName, suffixes) {
    return this.migrations.discover()
      .then(() => {
        const { directory } = this.config;
        const paths = this.migrations.step(migrationName, suffixes);
        const onStepCreated = (path) =>
          () => this.migrations.emit('fileCreated:step', path);

        return co(function* createStepFile() {
          for(const path of paths) {
            yield writeFileAsync(resolve(directory, path), '') .then(onStepCreated(path));
          }
        });
      })
      .finally(this.migrations.destroy);
  }
}
