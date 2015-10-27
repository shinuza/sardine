import assert from 'assert';

import config from '../../testConfig/sqlite3';
import SQLite3 from '../../../lib/db/drivers/sqlite3';
import Model from '../../../lib/db/model';
import errors from '../../../lib/errors';

describe('SQLite3', () => {
  describe('#disconnect()', () => {
    const db = new SQLite3(config);
    it('should not allow queries when #disconnect has been called', (done) => {

      db.connect()
        .then(() => db.query('SELECT 1;'))
        .then(() => db.disconnect())
        .then(() => db.query('SELECT 1;'))
        .then(() => done(new Error('Allowed a query after disconnect')))
        .catch(() => done());
    });
  });

  describe('Queries', () => {
    let db;
    let model;
    let wrappedInsert;
    let queries;

    beforeEach(() => {
      db = new SQLite3(config);
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
      it('should execute the given query', (done) => {
        const values = {
          name: 'foobar_query',
          applied: false,
          migration_time: new Date(2015, 0, 1, 1, 2, 3, 500), // eslint-disable-line camelcase
          checksum: 'checksum',
        };

        model.insert(values)
        .then(() => model.findAllByName())
        .then((res) => {
          assert.deepEqual(res, [{
            id: 1,
            name: 'foobar_query',
            applied: 0,
            migration_time: '2015-01-01 01:02:03.500',  // eslint-disable-line camelcase
            checksum: 'checksum',
          }]);
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
          assert.equal(e.code, errors.SQLITE.SQLITE_CONSTRAINT);
        })
        .then(() => model.countAll())
        .then((count) => {
          assert.equal(count, 0);
          done();
        })
        .catch(done);
      });
    });
  });
});
