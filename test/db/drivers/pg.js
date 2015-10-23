var assert = require('assert');

var helpers = require('./helpers');
var config = require('../../testSardineConfig');
var Pg = require('../../../lib/db/drivers/pg.jsx');

describe('Postgres', function() {
  describe('#close()', function() {
    it('should not allow queries when #close has been called', function(done) {
      const db = new Pg(config);

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
      db = new Pg(config);
    });

    afterEach(function(done) {
      helpers.drop(db)
        .then(() => {
          db.close();
          done();
        })
        .catch(done);
    });

    describe('#query()', function() {
      it('should run the given query and create the migration database beforehand', function(done) {
        const values = { name: 'foobar', 'applied': false, 'migration_time': new Date(2015, 0, 1, 1, 2, 3, 500), 'checksum': 'checksum'};

        db.connect()
        .then(() => helpers.insert(db, values))
        .then(() => helpers.select(db))
        .then((res) => {
          assert.deepEqual(res, [Object.assign({id: 1}, values)]);
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
