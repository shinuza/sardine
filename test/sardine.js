import assert from 'assert';
import fs from 'fs';
import { resolve, join } from 'path';

import _ from 'lodash';
import Promise from 'bluebird';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';

import Sardine from '../lib/';
import testConfig from './testConfig/pg';
import { config, CONFIG_TEMPLATE, SARDINE_CONFIG } from '../lib/config';
import { MigrationNotFound, PendingMigrations } from '../lib/errors';
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
  const { directory } = testConfig;
  const steps = ['foo', 'bar', 'baz', 'buzz', 'fizz', 'buzz', 'fizzbuzz'];

  before('Creating migration directory', () => mkdirpAsync(directory));
  after('Removing migration directory', () => rmrfAsync(directory));

  describe('.init()', () => {
    const sardineConfigPath = resolve(SANDBOX, SARDINE_CONFIG);

    after('Removing sardine config file', () => rmrfAsync(sardineConfigPath));

    it('should fire success event on creation', () =>
      Sardine.init(SANDBOX)
        .then((missing) => assert.equal(missing, true)));

    it('should fire noop event when the file already exists', () =>
      Sardine.init(SANDBOX)
        .then((missing) => assert.equal(missing, false))
        .then(() => readFileAsync(sardineConfigPath))
        .then((contents) => assert.deepEqual(contents.toString(), CONFIG_TEMPLATE)));
  });

  describe('#create()', () => {
    it('should create a migration directory and direction directories (up and down)', () => {
      const sardine = new Sardine(testConfig);
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
      return new Sardine(testConfig)
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
      const sardine = new Sardine(testConfig);
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
      return new Sardine(testConfig)
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
    const initialTableName = 'foo';
    const preprocessedTableName = 'bar';
    const customPreprocessor = (fileContent) =>
      fileContent.replace(new RegExp(initialTableName, 'g'), preprocessedTableName);

    function tableDoesntExist([row]) {
      assert.equal(row.matching, '0');
    }

    before(() => {
      const up = Promise.coroutine(function* writeUpSteps() {
        for(let i = 0; i < steps.length; i = i + 1) {
          const filename = stepFilename(i, steps[i]);
          const sql = `CREATE TABLE ${initialTableName}${i}(id serial NOT NULL);`;
          yield writeFileAsync(resolve(upDir, filename), sql);
        }
      })();

      const down = Promise.coroutine(function* writeDownSteps() {
        for(let i = 0; i < steps.length; i = i + 1) {
          const filename = stepFilename(i, steps[i]);
          const sql = `DROP TABLE ${initialTableName}${i};`;
          yield writeFileAsync(resolve(downDir, filename), sql);
        }
      })();

      return Promise.all([up, down]);
    });

    describe('#up()', () => {
      it('should apply the migration properly', () => {
        const sardine = new Sardine(testConfig);
        const model = sardine.migrations.model;

        return sardine.up()
          .then(() =>
            Promise.coroutine(function* checkMigrationsApplied() {
              for(let i = 0; i < steps.length; i = i + 1) {
                yield model.query(`SELECT 1 FROM ${initialTableName}${i}`);
              }
            })());
      });
    });

    describe('#down()', () => {
      it('should rollback the migration properly', () => {
        const sardine = new Sardine(testConfig);
        const model = sardine.migrations.model;

        return sardine.down(true)
          .then(() =>
            Promise.coroutine(function* checkMigrationsRolledback() {
              for(let i = 0; i < steps.length; i = i + 1) {
                yield model
                  .query(`SELECT count(*) AS matching FROM pg_class WHERE relname = '${initialTableName}${i}'`)
                  .then(tableDoesntExist);
              }
            })());
      });
    });

    describe('#up() with custom preprocessor', () => {
      it('should apply the migration properly', () => {
        const sardine = new Sardine({ ...testConfig, ...{ preprocess: customPreprocessor } });
        const model = sardine.migrations.model;

        return sardine.up()
          .then(() =>
            Promise.coroutine(function* checkMigrationsApplied() {
              for(let i = 0; i < steps.length; i = i + 1) {
                yield model.query(`SELECT 1 FROM ${preprocessedTableName}${i}`);
              }
            })());
      });
    });

    describe('#down() with custom preprocessor', () => {
      it('should rollback the migration properly', () => {
        const sardine = new Sardine({ ...testConfig, ...{ preprocess: customPreprocessor } });
        const model = sardine.migrations.model;

        return sardine.down(true)
          .then(() =>
            Promise.coroutine(function* checkMigrationsRolledback() {
              for(let i = 0; i < steps.length; i = i + 1) {
                yield model
                  .query(`SELECT count(*) AS matching FROM pg_class WHERE relname = '${preprocessedTableName}${i}'`)
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
        const sardine = new Sardine(testConfig);

        return sardine.current(currentOptions)
        .then((entries) => assert.deepEqual(entries, [
          'That\'s the current one: Initial state',
          'default 20151209_010320_foobar',
        ]));
      });

      it('should mark the latest migration as current, after we ran .up()', () => {
        const sardine = new Sardine(testConfig);
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

    describe('#compile(migrationName)', () => {
      it('should throw when the migration is unknown', () => {
        const sardine = new Sardine(testConfig);
        let hasThrown = false;

        return sardine.compile('fizzbuzz')
          .catch(MigrationNotFound, () => hasThrown = true)
          .then(() => assert(hasThrown));
      });

      it('should dump the current migration as a single buffer', () => {
        const sardine = new Sardine(testConfig);
        return sardine.compile('foobar').then((result) => {
          const { migration, files } = result;
          const { up, down } = files;

          assert(_.contains(migration.name, 'foobar'));

          assert.equal(up,
`-- 20151209_010320_foobar/up/01_foo.sql
CREATE TABLE foo0(id serial NOT NULL);

-- 20151209_010320_foobar/up/02_bar.sql
CREATE TABLE foo1(id serial NOT NULL);

-- 20151209_010320_foobar/up/03_baz.sql
CREATE TABLE foo2(id serial NOT NULL);

-- 20151209_010320_foobar/up/04_buzz.sql
CREATE TABLE foo3(id serial NOT NULL);

-- 20151209_010320_foobar/up/05_fizz.sql
CREATE TABLE foo4(id serial NOT NULL);

-- 20151209_010320_foobar/up/06_buzz.sql
CREATE TABLE foo5(id serial NOT NULL);

-- 20151209_010320_foobar/up/07_fizzbuzz.sql
CREATE TABLE foo6(id serial NOT NULL);

`);
          assert.equal(down,
`-- 20151209_010320_foobar/down/07_fizzbuzz.sql
DROP TABLE foo6;

-- 20151209_010320_foobar/down/06_buzz.sql
DROP TABLE foo5;

-- 20151209_010320_foobar/down/05_fizz.sql
DROP TABLE foo4;

-- 20151209_010320_foobar/down/04_buzz.sql
DROP TABLE foo3;

-- 20151209_010320_foobar/down/03_baz.sql
DROP TABLE foo2;

-- 20151209_010320_foobar/down/02_bar.sql
DROP TABLE foo1;

-- 20151209_010320_foobar/down/01_foo.sql
DROP TABLE foo0;

`);
        });
      });
    });
  });
});
