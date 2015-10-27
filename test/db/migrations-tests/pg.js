import assert from 'assert';

import Migrations from '../../../lib/migrations.jsx';
import errors from '../../../lib/errors.jsx';
import { pgRawQuery } from '../helpers';

describe('pg-migrations', () => {
  let migrations;
  const config = require('../../testConfig/pg');

  before((done) => {
    pgRawQuery(`CREATE DATABASE ${config.connection.database}`, done);
  });

  after((done) => {
    pgRawQuery(`DROP DATABASE ${config.connection.database}`, done);
  });

  afterEach((done) => {
    let p = Promise.resolve();
    if(migrations && migrations.model && migrations.model.driver.connected()) {
      p = migrations.model.disconnect();
    }
    p.then(done).catch(done);
  });

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
                { filename: '01_foo.sql', contents: 'CREATE TABLE foo1(id serial NOT NULL);' },
                { filename: '02_foo.sql', contents: 'CREATE TABLE foo2(id serial NOT NULL);' },
                { filename: '03_foo.sql', contents: 'CREATE TABLE foo3(id serial NOT NULL);' },
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
        },
      ];
      migrations.discovered = batch;
      migrations.up({ batch, recorded: [] })
        .then(() => migrations.model.driver.query('SELECT 1 from foo1, foo2, foo3, foo4'))
        .then(() => done())
        .catch(done);
    });
  });

  describe('#down()', () => {
    it('should throw when the batch is empty', () => {
      migrations = new Migrations(config);
      assert.throws(() => {
        migrations.down({ batch: [], recorded: [] });
      }, errors.EmptyBatchError);
    });

    it('should rollback the latest migration', (done) => {
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
          assert.equal(e.code, '42P01');
          done();
        });
    });
  });
});
