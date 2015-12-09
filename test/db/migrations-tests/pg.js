import assert from 'assert';

import Migrations from '../../../lib/migrations.jsx';
import errors from '../../../lib/errors.jsx';

describe('pg-migrations', () => {
  let migrations;
  const config = require('../../testConfig/pg');
  const testBatch = [
    {
      name: 'v1',
      checksum: 'v1_checksum',
      steps: 3,
      up: {
        files: [
          { filename: '01_foo.sql', contents: 'CREATE TABLE foo1(id integer PRIMARY KEY);' },
          {
            filename: '02_foo.sql',
            contents: `
              CREATE TABLE foo2(
                id integer PRIMARY KEY,
                foo2onfoo1 integer REFERENCES foo1(id)
              );`,
          },
          {
            filename: '03_foo.sql',
            contents: `
              CREATE TABLE foo3(
                id serial NOT NULL,
                foo3onfoo2 integer REFERENCES foo2(id)
              );`,
          },
        ],
      },
      down: {
        files: [
          { filename: '01_foo.sql', contents: 'DROP TABLE foo1;' },
          { filename: '02_foo.sql', contents: 'DROP TABLE foo2;' },
          { filename: '03_foo.sql', contents: 'DROP TABLE foo3;' },
        ],
      },
    },
    {
      name: 'v2',
      checksum: 'v2_checksum',
      steps: 1,
      up: {
        files: [
          { filename: '04_foo.sql', contents: 'CREATE TABLE foo4(id serial NOT NULL);' },
        ],
      },
      down: {
        files: [
          { filename: '04_foo.sql', contents: 'DROP TABLE foo4;' },
        ],
      },
    },
  ];

  describe('#up()', () => {
    it('should throw when the batch is empty', () => {
      migrations = new Migrations(config);
      assert.throws(() => {
        migrations.up({ batch: [], recorded: [] });
      }, errors.EmptyBatchError);
    });

    it('should create the given tables', () => {
      migrations = new Migrations(config);

      migrations.discovered = testBatch;
      return migrations.up({ batch: testBatch, recorded: [] })
        .then(() => migrations.model.driver.query('SELECT 1 from foo1, foo2, foo3, foo4'));
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
                { filename: '01_foo.sql', contents: 'CREATE TABLE foo5(id serial NOT NULL);' },
                { filename: '02_foo.sql', contents: 'CREATE TABLE OUPS);' },
                { filename: '03_foo.sql', contents: 'CREATE TABLE foo6(id serial NOT NULL);' },
            ],
          },
        },
      ];
      migrations.discovered = batch;
      migrations.up({ batch, recorded: [{ name: 'v2' }, { name: 'v3' }] })
        .catch((e) => {
          assert.notEqual(e, void 0);
          assert.strictEqual(e.code, errors.PG.SYNTAX_ERROR);
        })
        .then(() => migrations.model.driver.query('SELECT 1 from foo5'))
        .catch((e) => {
          assert.notEqual(e, void 0);
          assert.strictEqual(e.code, errors.PG.UNDEFINED_TABLE);
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

    it('should revert the latest migration', () => {
      migrations = new Migrations(config);
      migrations.discovered = testBatch;
      return migrations
        .down({
          batch: testBatch,
          recorded: [
            { name: 'v1', checksum: 'v1_checksum' },
            { name: 'v2', checksum: 'v2_checksum' },
          ],
        })
        .then(() => migrations.model.driver.query('SELECT 1 from foo4'))
        .then(() => {
          throw new Error('Did not revert latest migration');
        })
        .catch((e) => {
          assert.notEqual(e, void 0);
          assert.notEqual(e.code, void 0, e.message);
          assert.notEqual(e.code, errors.PG.DEPENDENT_OBJECTS_STILL_EXIST, 'Dependent objects were not removed');
          assert.equal(e.code, errors.PG.UNDEFINED_TABLE);
        });
    });
  });
});
