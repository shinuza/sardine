import { writeFile } from 'fs';
import { resolve } from 'path';

import _ from 'lodash';
import mkdirp from 'mkdirp';
import Promise from 'bluebird';

import { events, handlers } from './events';
import errors from './errors';
import actions from './actions';
import Finder from './finder';
import Migrations from './migrations';
import { getMigration } from './util';

const writeFileAsync = Promise.promisify(writeFile);

class Sardine {

  static init(cwd) {
    return actions.init(cwd);
  }

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

      });
  }

  step(migrationName, suffixes) {
    return this.finder.discover()
      .then((discovered) => {
        const { directory } = this.config;
        const paths = actions.step(discovered, migrationName, suffixes);
        const onStepCreated = (path) =>
          () => this.emit(events.STEP_FILE_CREATED, path);

        return Promise.coroutine(function* createStepFile() {
          for(const path of paths) {
            yield writeFileAsync(resolve(directory, path), '') .then(onStepCreated(path));
          }
        })();
      });
  }

  current(options) {
    return Promise.all([this.finder.discover(), this.migrations.model.findAllByName()])
      .then(([discovered, recorded]) => {
        return actions.state(discovered, recorded)
          .map((migration) => {
            const fns = Object.assign({
              default: _.identity,
              initial: _.identity,
              current: _.identity,
            }, options);
            const stack = [migration.current ? fns.current : fns.default];

            if(migration.initial) {
              stack.push(fns.initial);
            }

            return _.compose(...stack)(migration.name);
          });
      });
  }

  up() {
    return this.migrations
      .getUpdateBatch()
      .then(this.migrations.up);
  }

  down(all) {
    return this.migrations
      .getRollbackBatch(all)
      .then(this.migrations.down);
  }

  compile(migrationName) {
    return this.finder.discover()
      .then((discovered) => {
        const migration = getMigration(discovered, migrationName);
        let { up, down } = migration;

        down.files.reverse();

        up = up.files.reduce(this._mergeFiles.bind(this), '');
        down = down.files.reduce(this._mergeFiles.bind(this), '');

        return {
          migration,
          files: { up, down },
        };
      });
  }

  _mergeFiles(prev, { contents, filename }) {
    const processedContents = this.config.preprocess(contents.toString(), filename);
    return prev + `-- ${filename}\n${processedContents}\n\n`;
  }

}

Object.assign(Sardine, handlers);

export default Sardine;
