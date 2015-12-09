import assert from 'assert';
import fs from 'fs';
import { resolve, join } from 'path';

import _ from 'lodash';
import Promise from 'bluebird';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';

import Sardine from '../lib/';
import config from './testConfig/pg';
import { CONFIG_TEMPLATE, SARDINE_CONFIG } from '../lib/config';
import { MigrationNotFound, MissingConfiguration, PendingMigrations } from '../lib/errors';
import { events } from '../lib/events';
import { snake } from '../lib/date';
import { twoDigits } from '../lib/util';

const readFileAsync = Promise.promisify(fs.readFile);
const statAsync = Promise.promisify(fs.stat);
const writeFileAsync = Promise.promisify(fs.writeFile);
const rmrfAsync = Promise.promisify(rimraf);
const mkdirpAsync = Promise.promisify(mkdirp);
const SANDBOX = resolve(__dirname, 'sandbox');

function stepFilename(index, step) {
  return `${twoDigits(index + 1)}_${step}.sql`;
}

function migrationDir(date, suffix) {
  return `${snake(date)}_${suffix}`;
}

describe('Sardine', () => {
  const { directory } = config;
  const steps = ['foo', 'bar', 'baz', 'buzz', 'fizz', 'buzz', 'fizzbuzz'];

  before('Creating migration directory', () => mkdirpAsync(directory));
  after('Removing migration directory', () => rmrfAsync(directory));

  describe('#init()', () => {
    const sardineConfigPath = resolve(SANDBOX, SARDINE_CONFIG);
    after('Removing sardine config file', () => rmrfAsync(sardineConfigPath));

    it('should fire success event on creation', () => {
      const sardine = new Sardine(config);
      const promise = Promise.reject(new MissingConfiguration('Foobar'));
      const eventsParameters = [];

      function recordEvent() {
        eventsParameters.push('called');
      }

      sardine.on(events.INIT_SUCCESS, recordEvent);

      return sardine.init(promise, SANDBOX).then(() => {
        assert.deepEqual(eventsParameters, ['called']);
        return readFileAsync(sardineConfigPath)
          .then((contents) => assert.deepEqual(contents.toString(), CONFIG_TEMPLATE));
      });
    });

    it('should fire noop event when the file already exists', () => {
      const sardine = new Sardine(config);
      const promise = Promise.resolve();
      const eventsParameters = [];

      function recordEvent() {
        eventsParameters.push('called');
      }

      sardine.on(events.INIT_NOOP, recordEvent);

      return readFileAsync(sardineConfigPath)
        .then((contents) => assert.deepEqual(contents.toString(), CONFIG_TEMPLATE))
        .then(() => sardine.init(promise, SANDBOX))
        .then(() => assert.deepEqual(eventsParameters, ['called']));
    });
  });

  describe('#create()', () => {
    it('should create a migration directory and direction directories (up and down)', () => {
      const sardine = new Sardine(config);
      const dirs = ['', 'up', 'down'];
      const date = new Date(2015, 11, 9, 1, 3, 20);
      const expectedDir = migrationDir(date, 'foobar');
      const eventsParameters = [];

      function recordEvent(...args) {
        eventsParameters.push(args);
      }

      sardine.on(events.CREATED_MIGRATION_DIRECTORY, recordEvent);
      sardine.on(events.CREATED_DIRECTION_DIRECTORY, recordEvent);

      return sardine.create(date, 'foobar').then(() =>
        Promise.coroutine(function* checkDirectories() {
          for(const dir of dirs) {
            yield statAsync(resolve(directory, expectedDir, dir));
          }
        })())
        .then(() => {
          assert.deepEqual(eventsParameters, dirs.map((dir) => [join(expectedDir, dir)]));
        });
    });

    it('should fail since another pending migration exists', () => {
      let hasThrown = false;
      return new Sardine(config)
        .create(new Date(), 'barbuz')
        .catch((e) => {
          assert.equal(e.constructor, PendingMigrations);
          hasThrown = true;
        })
        .then(() => assert(hasThrown, 'As thrown'));
    });
  });

  describe('#step()', () => {
    it('should create step files', () => {
      const sardine = new Sardine(config);
      const date = new Date(2015, 11, 9, 1, 3, 20);
      const expectedDir = migrationDir(date, 'foobar');
      const upDir = resolve(directory, expectedDir, 'up');
      const downDir = resolve(directory, expectedDir, 'down');
      const eventsParameters = [];

      sardine.on(events.STEP_FILE_CREATED, (file) => {
        eventsParameters.push(file);
      });

      return sardine.step('foobar', steps).then(() =>
        Promise.coroutine(function* checkSteps() {
          for(let i = 0; i < steps.length; i = i + 1) {
            const filename = stepFilename(i, steps[i]);
            yield statAsync(resolve(upDir, filename));
            yield statAsync(resolve(downDir, filename));
          }
        })())
        .then(() => {
          const expected = ['up', 'down'].reduce((acc, direction) => {
            steps.forEach((step, index) => {
              acc.push(join(expectedDir, direction, stepFilename(index, step)));
            });
            return acc;
          }, []);
          assert.deepEqual(eventsParameters, expected);
        });
    });

    it('should fail when the migration is unknown', () => {
      let hasThrown = false;
      return new Sardine(config)
        .step('unknown', steps)
        .catch((e) => {
          assert.equal(e.constructor, MigrationNotFound);
          hasThrown = true;
        })
        .then(() => assert(hasThrown));
    });
  });

  describe('directions', () => {
    const date = new Date(2015, 11, 9, 1, 3, 20);
    const expectedDir = migrationDir(date, 'foobar');
    const upDir = resolve(directory, expectedDir, 'up');
    const downDir = resolve(directory, expectedDir, 'down');

    before(() => {
      const up = Promise.coroutine(function* writeUpSteps() {
        for(let i = 0; i < steps.length; i = i + 1) {
          const filename = stepFilename(i, steps[i]);
          const sql = `CREATE TABLE foo${i}(id serial NOT NULL);`;
          yield writeFileAsync(resolve(upDir, filename), sql);
        }
      })();

      const down = Promise.coroutine(function* writeDownSteps() {
        for(let i = 0; i < steps.length; i = i + 1) {
          const filename = stepFilename(i, steps[i]);
          const sql = `DROP TABLE foo${i};`;
          yield writeFileAsync(resolve(downDir, filename), sql);
        }
      })();

      return Promise.all([up, down]);
    });

    describe('#up()', () => {
      it('should apply the migration properly', () => {
        const sardine = new Sardine(config);
        const model = sardine.migrations.model;

        return sardine.up()
          .then(() =>
            Promise.coroutine(function* checkMigrationsApplied() {
              for(let i = 0; i < steps.length; i = i + 1) {
                yield model.query(`SELECT 1 FROM foo${i}`);
              }
            })());
      });
    });

    describe('#down()', () => {
      it('should rollback the migration properly', () => {
        const sardine = new Sardine(config);
        const model = sardine.migrations.model;

        function tableDoesntExist([row]) {
          assert.equal(row.matching, '0');
        }

        return sardine.down(true)
          .then(() =>
            Promise.coroutine(function* checkMigrationsRolledback() {
              for(let i = 0; i < steps.length; i = i + 1) {
                yield model
                  .query(`SELECT COUNT (relname) as matching FROM pg_class WHERE relname = 'foo${i}'`)
                  .then(tableDoesntExist);
              }
            })());
      });
    });

    describe('#current(options)', () => {
      const currentOptions = {
        initial: (n) => `${_.capitalize(n)} state`,
        default: (n) => `default ${n}`,
        current: (n) => `That's the current one: ${n}`,
      };

      it('should mark initial state as current', () => {
        const sardine = new Sardine(config);

        return sardine.current(currentOptions)
        .then((entries) => assert.deepEqual(entries, [
          'That\'s the current one: Initial state',
          'default 20151209_010320_foobar',
        ]));
      });

      it('should mark the latest migration as current, after we ran .up()', () => {
        const sardine = new Sardine(config);
        return Promise.coroutine(function* updateAndState() {
          yield sardine.up();
          yield sardine.current(currentOptions)
          .then((entries) => assert.deepEqual(entries, [
            'default Initial state',
            'That\'s the current one: 20151209_010320_foobar',
          ])());
        });
      });
    });
  });
});
