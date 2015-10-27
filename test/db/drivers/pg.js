import assert from 'assert';

import config from '../../testConfig/pg';
import Pg from '../../../lib/db/drivers/pg';
import Model from '../../../lib/db/model';
import { pgRawQuery } from '../helpers';

describe('Postgres', () => {
  let db;

  before((done) => {
    pgRawQuery(`CREATE DATABASE ${config.connection.database}`, done);
  });

  after((done) => {
    let p = Promise.resolve();
    if(db.connected()) {
      p = db.disconnect();
    }

    p.then(() => pgRawQuery(`DROP DATABASE ${config.connection.database}`, done))
      .catch(done);
  });

  describe('#disconnect()', () => {
    it('should not allow queries when #disconnect has been called', (done) => {
      db = new Pg(config);

      db.connect()
        .then(() => db.query('SELECT 1;'))
        .then(() => db.disconnect())
        .then(() => db.query('SELECT 1;'))
        .then(() => done(new Error('Allowed a query after #disconnect()')))
        .catch(() => done());
    });
  });

  describe('Queries', () => {
    let model;
    let wrappedInsert;
    let queries;

    beforeEach(() => {
      db = new Pg(config);
      model = new Model(config);
      model.driver = db;
      wrappedInsert = (values) => {
        return () => model.insert(values);
      };
      queries = [
        {
          name: 'foobar1',
          applied: false,
          migration_time: new Date(2015, 0, 1, 1, 2, 3, 500), // eslint-disable-line camelcase
          checksum: 'checksum',
        },
        {
          name: 'foobar2',
          applied: false,
          migration_time: new Date(2015, 0, 1, 1, 2, 3, 500), // eslint-disable-line camelcase
          checksum: 'checksum',
        },
        {
          name: 'foobar3',
          applied: false,
          migration_time: new Date(2015, 0, 1, 1, 2, 3, 500), // eslint-disable-line camelcase
          checksum: 'checksum',
        },
      ].map(wrappedInsert);
    });

    afterEach((done) => {
      if(db.connected()) {
        return model.dropTable()
          .then(() => {
            done();
            return db.disconnect();
          })
          .catch(done);
      }
      done();
    });

    describe('#query()', () => {
      it('should run the given query', (done) => {
        const values = {
          name: 'foobar_query',
          applied: false,
          migration_time: new Date(2015, 0, 1, 1, 2, 3, 500), // eslint-disable-line camelcase
          checksum: 'checksum',
        };

        db.connect()
          .then(() => model.insert(values))
          .then(() => model.findAllByName())
          .then((res) => {
            assert.deepEqual(res, [Object.assign({ id: 1 }, values)]);
            done();
          })
          .catch(done);
      });
    });

    describe('#transaction()', () => {
      it('should commit the transaction with valid queries', (done) => {
        db.connect()
          .then(() => db.transaction(queries))
          .then(() => model.countAll())
          .then((count) => {
            assert.equal(count, 3);
            done();
          })
          .catch(done);
      });

      it('should rollback the transaction with invalid queries', (done) => {
        queries[1] = wrappedInsert({
          name: null,
          applied: false,
          migration_time: new Date(2015, 0, 1, 1, 2, 3, 502), // eslint-disable-line camelcase
          checksum: 'checksum',
        });

        db.connect()
          .then(() => db.transaction(queries))
          .catch((e) => {
            assert.notEqual(e, void 0);
            assert.equal(e.code, '23502');
          })
          .then(() => model.countAll())
          .then((count) => {
            assert.strictEqual(count, '0');
            done();
          })
          .catch(done);
      });
    });

  });
});
