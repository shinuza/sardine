import assert from 'assert';

import Migrations from '../../../lib/migrations.jsx';
import errors from '../../../lib/errors.jsx';

describe('sqlite3-migrations', () => {
  let migrations;
  const config = require('../../testConfig/sqlite3');

  describe('#up()', () => {
    it('should throw when the batch is empty', () => {
      migrations = new Migrations(config);
      assert.throws(() => {
        migrations.up({ batch: [], recorded: [] });
      }, errors.EmptyBatchError);
    });

    it('should create the given tables', (done) => {
      migrations = new Migrations(config);
      const batch = [
        {
          name: 'v1',
          checksum: 'v1_checksum',
          steps: 3,
          up: {
            files: [
              { filename: '01_foo.sql', contents: 'CREATE TABLE foo1("id" INTEGER PRIMARY KEY AUTOINCREMENT);' },
              { filename: '02_foo.sql', contents: 'CREATE TABLE foo2("id" INTEGER PRIMARY KEY AUTOINCREMENT);' },
              { filename: '03_foo.sql', contents: 'CREATE TABLE foo3("id" INTEGER PRIMARY KEY AUTOINCREMENT);' },
            ],
          },
        },
        {
          name: 'v2',
          checksum: 'v2_checksum',
          steps: 1,
          up: {
            files: [
              { filename: '04_foo.sql', contents: 'CREATE TABLE foo4("id" INTEGER PRIMARY KEY AUTOINCREMENT);' },
            ],
          },
        },
      ];
      migrations.discovered = batch;
      migrations.up({ batch, recorded: [] })
        .then(() => migrations.model.driver.query('SELECT 1 from foo1, foo2, foo3, foo4'))
        .then(() => done())
        .catch(done);
    });

    it('should rollback when one of the steps contains an error', (done) => {
      migrations = new Migrations(config);
      const batch = [
        {
          name: 'v3',
          checksum: 'v3_checksum',
          steps: 3,
          up: {
            files: [
                { filename: '01_foo.sql', contents: 'CREATE TABLE fo5("id" INTEGER PRIMARY KEY AUTOINCREMENT);' },
                { filename: '02_foo.sql', contents: 'CREATE TABLE OUPS);' },
                { filename: '03_foo.sql', contents: 'CREATE TABLE fo6("id" INTEGER PRIMARY KEY AUTOINCREMENT);' },
            ],
          },
        },
      ];
      migrations.discovered = batch;
      migrations.up({ batch, recorded: [{ name: 'v2' }, { name: 'v3' }] })
        .catch((e) => {
          assert.notEqual(e, void 0);
          assert.strictEqual(e.code, errors.SQLITE.SQLITE_ERROR);
        })
        .then(() => migrations.model.driver.query('SELECT 1 from foo5'))
        .catch((e) => {
          assert.notEqual(e, void 0);
          assert.strictEqual(e.code, errors.SQLITE.SQLITE_ERROR);
        })
        .then(() => done());
    });
  });

  describe('#down()', () => {
    it('should throw when the batch is empty', () => {
      migrations = new Migrations(config);
      assert.throws(() => {
        migrations.down({ batch: [], recorded: [] });
      }, errors.EmptyBatchError);
    });

    it('should revert the latest migration', (done) => {
      migrations = new Migrations(config);
      const batch = [
        {
          name: 'v2',
          checksum: 'v2_checksum',
          steps: 1,
          down: {
            files: [
              { filename: '04_foo.sql', contents: 'DROP TABLE foo4;' },
            ],
          },
        },
      ];
      migrations.discovered = batch;
      migrations.down({ batch, recorded: [{ name: 'v1' }, { name: 'v2' }] })
        .then(() => migrations.model.driver.query('SELECT 1 from foo4'))
        .then(() => {
          done(new Error('Did not revert latest migrations'));
        })
        .catch((e) => {
          assert.notEqual(e, void 0);
          assert.equal(e.code, 'SQLITE_ERROR');
          done();
        });
    });
  });
});
