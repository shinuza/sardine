import assert from 'assert';

import Migrations from '../../../lib/migrations.jsx';
import errors from '../../../lib/errors.jsx';

describe('sqlite3-migrations', () => {
  const config = require('../../testConfig/sqlite3');
  const migrations = new Migrations(config);
  const testBatch = [
    {
      name: 'v1',
      checksum: 'v1_checksum',
      steps: 2,
      up: {
        files: [
          {
            filename: '01_foo.sql',
            contents: 'CREATE TABLE foo1("id" INTEGER PRIMARY KEY AUTOINCREMENT);',
          },
          {
            filename: '02_foo.sql',
            contents: 'DROP TABLE foo1;',
          },
        ],
      },
      down: {
        files: [
          {
            filename: '01_foo.sql',
            contents: 'DROP TABLE foo1;',
          },
          {
            filename: '02_foo.sql',
            contents: 'CREATE TABLE foo1("id" INTEGER PRIMARY KEY AUTOINCREMENT);',
          },
        ],
      },
    },
    {
      name: 'v2',
      checksum: 'v2_checksum',
      steps: 2,
      up: {
        files: [
          {
            filename: '03_foo.sql',
            contents: 'CREATE TABLE foo2("id" INTEGER PRIMARY KEY AUTOINCREMENT);',
          },
          {
            filename: '04_foo.sql',
            contents: 'CREATE TABLE foo3("id" INTEGER PRIMARY KEY AUTOINCREMENT);',
          },
        ],
      },
      down: {
        files: [
          {
            filename: '03_foo.sql',
            contents: 'DROP TABLE foo2',
          },
          {
            filename: '04_foo.sql',
            contents: `DROP TABLE foo3`,
          },
        ],
      },
    },
  ];

  describe('#up()', () => {
    it('should throw when the batch is empty', () => {
      assert.throws(() => {
        migrations.up({ batch: [], recorded: [] });
      }, errors.EmptyBatchError);
    });

    it('should create the given tables', () => {
      migrations.discovered = testBatch;
      return migrations.up({ batch: testBatch, recorded: [] })
        .then(() => migrations.model.driver.query('SELECT 1 from foo2, foo3'));
    });

    it('should rollback when one of the steps contains an error', (done) => {
      const batch = [
        {
          name: 'v3',
          checksum: 'v3_checksum',
          steps: 3,
          up: {
            files: [
                { filename: '01_foo.sql', contents: 'CREATE TABLE foo5("id" INTEGER PRIMARY KEY AUTOINCREMENT);' },
                { filename: '02_foo.sql', contents: 'CREATE TABLE OUPS);' },
                { filename: '03_foo.sql', contents: 'CREATE TABLE foo6("id" INTEGER PRIMARY KEY AUTOINCREMENT);' },
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
      assert.throws(() => {
        migrations.down({ batch: [], recorded: [] });
      }, errors.EmptyBatchError);
    });

    it('should revert the latest migration in the correct order', () => {
      migrations.discovered = testBatch;
      return migrations
        .down({
          batch: testBatch,
          recorded: [
            { name: 'v1', checksum: 'v1_checksum' },
            { name: 'v2', checksum: 'v2_checksum' },
          ],
        })
        .catch((e) => {
          // Can't throw here because it would be catched by one of the catch() below, we fail instead.
          assert(!e, 'Migration failed');
        })
        .then(() => migrations.model.driver.query('SELECT 1 from foo3'))
        .then(() => {
          throw new Error('Did not revert latest migration');
        })
        .catch((e) => {
          assert.notEqual(e, void 0);
          assert.notEqual(e.code, void 0, e.message);
          assert.equal(e.cause.message, 'SQLITE_ERROR: no such table: foo3');
        })
        .then(() => migrations.model.driver.query('SELECT 1 from foo1'))
        .then(() => {
          throw new Error('Did not revert migration in the right order');
        })
        .catch((e) => {
          assert.notEqual(e, void 0);
          assert.notEqual(e.code, void 0, e.message);
          assert.equal(e.cause.message, 'SQLITE_ERROR: no such table: foo1');
        });
    });
  });
});
