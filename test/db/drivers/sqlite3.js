var assert = require('assert');

var helpers = require('./helpers');
var config = require('../../testSardineConfig');
var SQLite3 = require('../../../lib/db/drivers/sqlite3.jsx');

describe('SQLite3', function() {
  describe('#close()', function() {
    it('should not allow queries when #close has been called', function(done) {
      const db = new SQLite3(config);

      db.connect()
        .then(() => db.query('SELECT 1;'))
        .then(() => db.close())
        .then(() => db.query('SELECT 1;'))
        .then(() => done(new Error('Allowed a query after close')))
        .catch((e) => done());
    });
  });

  describe('Queries', function() {
    let db;
    beforeEach(function() {
      db = new SQLite3(config);
    });

    afterEach(function(done) {
      if(db.connected()) {
        return helpers.drop(db)
          .then(() => {
            done();
            return db.close();
          })
          .catch(done);
      }
      done();
    });

    describe('#query()', function() {
      it('should not allow a query if connect() was never called', function(done) {
        db.query('SELECT 1')
          .then(() => done(new Error('Allowed a query on a closed database')))
          .catch((e) => done());
      });

      it('should run the given query and create the migration database beforehand', function(done) {
        const values = { name: 'foobar', 'applied': false, 'migration_time': new Date(2015, 0, 1, 1, 2, 3, 500), 'checksum': 'checksum'};

        db.connect()
        .then(() => helpers.insert(db, values))
        .then(() => helpers.select(db))
        .then((res) => {
          assert.deepEqual(res, [{
            id: 1,
            name: 'foobar',
            applied: false,
            migration_time: '2015-01-01 01:02:03.500',
            checksum: 'checksum'
          }]);
          done();
        })
        .catch(done);
      });
    });

    describe('#transaction()', function() {
      it('should run the commit the transaction with valid queries', function(done) {
        const wrapInsert = (values) => {
          return () => helpers.insert(db, values);
        };
        const queries = [
          { name: 'foobar', 'applied': false, 'migration_time': new Date(2015, 0, 1, 1, 2, 3, 500), 'checksum': 'checksum'},
          { name: 'foobar', 'applied': false, 'migration_time': new Date(2015, 0, 1, 1, 2, 3, 502), 'checksum': 'checksum'},
          { name: 'foobar', 'applied': false, 'migration_time': new Date(2015, 0, 1, 1, 2, 3, 502), 'checksum': 'checksum'}
        ].map(wrapInsert);

        db.connect()
        .then(() => db.transaction(queries))
        .then(() => helpers.count(db))
        .then((count) => {
          assert.equal(count, 3);
          done();
        })
        .catch(done);
      });

      it('should run the rollback the transaction with invalid queries', function(done) {
        const wrapInsert = (values) => {
          return () => helpers.insert(db, values);
        };
        const queries = [
          { name: 'foobar', 'applied': false, 'migration_time': new Date(2015, 0, 1, 1, 2, 3, 500), 'checksum': 'checksum'},
          { name: null, 'applied': false, 'migration_time': new Date(2015, 0, 1, 1, 2, 3, 502), 'checksum': 'checksum'},
          { name: 'foobar', 'applied': false, 'migration_time': new Date(2015, 0, 1, 1, 2, 3, 502), 'checksum': 'checksum'}
        ].map(wrapInsert);

        db.connect()
        .then(() => db.transaction(queries))
        .catch((e) => assert.notEqual(e, undefined))
        .then(() => helpers.count(db))
        .then((count) => {
          assert.equal(count, 0);
          done();
        });
      });
    });
  });
});
