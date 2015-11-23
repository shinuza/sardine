import assert from 'assert';
import fs from 'fs';
import path from 'path';

import Promise from 'bluebird';

import Migrations from '../lib/migrations';
import errors from '../lib/errors';
import { events } from '../lib/events';
import { SARDINE_CONFIG } from '../lib/config';
import config from './testConfig/sqlite3';  // It doesn't matter, really

const SANDBOX = path.resolve(__dirname, 'sandbox');

describe('Migrations', () => {
  describe('#isLastest()', () => {
    it('detect the latest migration', () => {
      const migrations = new Migrations(config);
      migrations.discovered = [{ name: 'foo' }, { name: 'bar' }];

      assert.equal(true, migrations._isLatest({ name: 'bar' }));
      assert.equal(false, migrations._isLatest({ name: 'foo' }));
    });
  });

  describe('@checkIntegrity', () => {
    it('it should detect missing down', () => {
      assert.throws(() => {
        Migrations.checkIntegrity([{ filename: 'foo.sql' }, { filename: 'bar.sql' }], [{ filename: 'foo.sql' }, void 0]);
      }, errors.IntegrityError);
    });

    it('it should detect missing up', () => {
      assert.throws(() => {
        Migrations.checkIntegrity([{ filename: 2 }, void 0], [{ filename: 1 }, { filename: 2 }]);
      }, errors.IntegrityError);
    });

    it('it should detect missmatched filename', () => {
      Migrations.checkIntegrity([{ filename: 1 }, { filename: 2 }], [{ filename: 1 }, { filename: 2 }]);
      assert.throws(() => {
        Migrations.checkIntegrity([{ filename: 1 }, { filename: 2 }], [{ filename: 1 }, { filename: 3 }]);
      }, errors.IntegrityError);
    });
  });

  describe('#create(suffix)', () => {
    it('should return paths for a given date and suffix', () => {
      const migrations = new Migrations(config);
      const rootDir = '20150210_221003_foobar';
      const expected = {
        up: path.join(rootDir, 'up'),
        down: path.join(rootDir, 'down'),
        rootDir,
      };

      const paths = migrations.create(new Date(2015, 1, 10, 22, 10, 3), 'foobar');
      assert.deepEqual(paths, expected);
    });
  });

  describe('init(#config, path)', () => {
    after((done) => {
      const f = path.resolve(SANDBOX, SARDINE_CONFIG);
      fs.unlink(f, done);
    });

    it('should create the sardineConfig file when it does not exist', (done) => {
      const migrations = new Migrations(config);
      const p = Promise.reject(new errors.MissingConfiguration('Yup, it failed'));

      migrations.on(events.INIT_SUCCESS, () => {
        assert(require(path.resolve(SANDBOX, SARDINE_CONFIG)) !== void 0);
        done();
      });

      migrations.init(p, SANDBOX).catch(done);
    });

    it('should not create the sandineConfig file when it already exists', (done) => {
      const migrations = new Migrations(config);
      const p = Promise.resolve();

      migrations.on(events.INIT_SUCCESS, () => {
        assert(false, 'Success was called');
        done();
      });
      migrations.on(events.INIT_NOOP, done);

      migrations.init(p, SANDBOX).catch(done);
    });
  });

  describe('#step(migrationName, suffixes [, suffixes])', () => {
    it('should return paths for a given suffix and list of names given', () => {
      const migrations = new Migrations(config);
      migrations.discovered = [
        { name: '20150210_221003_foobar', steps: 2 },
        { name: '20150210_221203_fizzbuzz', steps: 0 },
      ];
      const expected = [
        path.join('20150210_221003_foobar', 'up', '03_baz.sql'),
        path.join('20150210_221003_foobar', 'up', '04_buz.sql'),
        path.join('20150210_221003_foobar', 'down', '03_baz.sql'),
        path.join('20150210_221003_foobar', 'down', '04_buz.sql'),
      ];

      const paths = migrations.step('foobar', ['baz', 'buz']);
      assert.deepEqual(paths, expected);
    });

    it('should return null if the fuzzy search fails', () => {
      const migrations = new Migrations(config);

      migrations.discovered = [{ name: '20150210_221003_foobar' }, { name: '20150210_221203_fizzbuzz' }];
      assert.throws(() => {
        migrations.step('notfound', ['baz', 'buz']);
      }, errors.MigrationNotFound);
    });
  });

  describe('#state(discovered, recorded)', () => {
    it('should return a list of discovered migrations indicating if they are the current one or not', () => {
      const migrations = new Migrations(config);
      const discovered = [
        { name: '20150210_221003_foo' },
        { name: '20150210_221203_bar' },
        { name: '20150210_221003_buz' },
        { name: '20150210_221203_fizzbuzz' },
      ];
      const recorded = [
        { name: '20150210_221003_foo', applied: true },
        { name: '20150210_221203_bar', applied: true },
      ];

      const state = migrations.state(discovered, recorded);
      assert.deepEqual([
        { name: '20150210_221003_foo', current: false },
        { name: '20150210_221203_bar', current: true },
        { name: '20150210_221003_buz', current: false },
        { name: '20150210_221203_fizzbuzz', current: false },
      ], state);
    });
  });
});
