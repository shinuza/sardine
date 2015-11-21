import assert from 'assert';
import fs from 'fs';
import { resolve, join } from 'path';

import co from 'co';
import Promise from 'bluebird';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';

import Sardine from '../lib/';
import config from './testConfig/pg';
import { events } from '../lib/events';
import { snake } from '../lib/date';
import { twoDigits } from '../lib/util';
import { pgRawQuery } from './db/helpers';

const statAsync = Promise.promisify(fs.stat);
const rmrfAsync = Promise.promisify(rimraf);
const mkdirpAsync = Promise.promisify(mkdirp);
const writeFileAsync = Promise.promisify(fs.writeFile);

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

  before('Creating test database', (done) => {
    pgRawQuery(`CREATE DATABASE ${config.connection.database}`, done);
  });

  after('Droping test database', (done) => {
    pgRawQuery(`DROP DATABASE IF EXISTS ${config.connection.database}`, done);
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
        co(function* checkDirectories() {
          for(const dir of dirs) {
            yield statAsync(resolve(directory, expectedDir, dir));
          }
        }))
        .then(() => {
          assert.deepEqual(eventsParameters, dirs.map((dir) => [join(expectedDir, dir)]));
        });
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
        co(function* checkSteps() {
          for(let i = 0; i < steps.length; i = i + 1) {
            const filename = stepFilename(i, steps[i]);
            yield statAsync(resolve(upDir, filename));
            yield statAsync(resolve(downDir, filename));
          }
        }))
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
  });

  describe('directions', () => {
    const date = new Date(2015, 11, 9, 1, 3, 20);
    const expectedDir = migrationDir(date, 'foobar');
    const upDir = resolve(directory, expectedDir, 'up');
    const downDir = resolve(directory, expectedDir, 'down');

    before(() => {
      const up = co(function* writeUpSteps() {
        for(let i = 0; i < steps.length; i = i + 1) {
          const filename = stepFilename(i, steps[i]);
          const sql = `CREATE TABLE foo${i}(id serial NOT NULL);`;
          yield writeFileAsync(resolve(upDir, filename), sql);
        }
      });

      const down = co(function* writeDownSteps() {
        for(let i = 0; i < steps.length; i = i + 1) {
          const filename = stepFilename(i, steps[i]);
          const sql = `DROP TABLE foo${i};`;
          yield writeFileAsync(resolve(downDir, filename), sql);
        }
      });

      return Promise.all([up, down]);
    });

    describe('#up()', () => {
      it('should apply the migration properly', (done) => {
        const sardine = new Sardine(config);
        const model = sardine.migrations.model;

        return sardine.up()
          .then(() => model.connect())
          .then(() =>
            co(function* checkMigrationsApplied() {
              for(let i = 0; i < steps.length; i = i + 1) {
                yield model.query(`SELECT 1 FROM foo${i}`);
              }
            }))
          .catch(done)
          .then(() => model.disconnect())
          .then(() => done());
      });
    });

    describe('#down()', () => {
      it('should rollback the migration properly', (done) => {
        const sardine = new Sardine(config);
        const model = sardine.migrations.model;

        function tableDoesntExist([row]) {
          assert.equal(row.matching, '0');
        }

        return sardine.down()
          .then(() => model.connect())
          .then(() =>
            co(function* checkMigrationsRolledback() {
              for(let i = 0; i < steps.length; i = i + 1) {
                yield model
                  .query(`SELECT COUNT (relname) as matching FROM pg_class WHERE relname = 'foo${i}'`)
                  .then(tableDoesntExist);
              }
            }))
          .catch(done)
          .then(() => model.disconnect())
          .then(() => done());
      });
    });

  });
});
