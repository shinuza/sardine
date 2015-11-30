import { writeFile } from 'fs';
import { resolve } from 'path';

import co from 'co';
import mkdirp from 'mkdirp';
import Promise from 'bluebird';

import { events, handlers } from './events';
import errors from './errors';
import actions from './actions';
import Finder from './finder';
import Migrations from './migrations';

const writeFileAsync = Promise.promisify(writeFile);

class Sardine {
  constructor(config) {
    this.config = config;
    this.migrations = new Migrations(config);
    this.finder = new Finder(config.directory);
    Object.assign(this, handlers);
  }

  on(...args) {
    this.migrations.on(...args);
  }

  off(...args) {
    this.migrations.off(...args);
  }

  once(...args) {
    this.migrations.once(...args);
  }

  emit(...args) {
    this.migrations.emit(...args);
  }

  init(config, cwd) {
    return actions.init(config, cwd)
      .then((created) => this.emit(created ? events.INIT_SUCCESS : events.INIT_NOOP))
      .then(this.migrations.destroy);
  }

  create(date, suffix) {
    return this.migrations.getUpdateBatch()
      .then(({ batch }) => {
        if(batch.length) {
          throw new errors.PendingMigrations(
            'You can only edit one new migration at the time, run "sardine up" before creating a new one');
        }

        const paths = actions.create(date, suffix);
        const { directory } = this.config;

        this.emit(events.CREATED_MIGRATION_DIRECTORY, paths.rootDir);
        mkdirp.sync(resolve(directory));

        this.emit(events.CREATED_DIRECTION_DIRECTORY, paths.up);
        mkdirp.sync(resolve(directory, paths.up));

        this.emit(events.CREATED_DIRECTION_DIRECTORY, paths.down);
        mkdirp.sync(resolve(directory, paths.down));

      }).finally(this.migrations.destroy);
  }

  step(migrationName, suffixes) {
    return this.finder.discover()
      .then((discovered) => {
        const { directory } = this.config;
        const paths = actions.step(discovered, migrationName, suffixes);
        const onStepCreated = (path) =>
          () => this.emit(events.STEP_FILE_CREATED, path);

        return co(function* createStepFile() {
          for(const path of paths) {
            yield writeFileAsync(resolve(directory, path), '') .then(onStepCreated(path));
          }
        });
      })
      .finally(this.migrations.destroy);
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
}

export default Sardine;
