var assert = require('assert');

var config = require('../../testConfig/pg');
var Pg = require('../../../lib/db/drivers/pg.jsx');
var Model = require('../../../lib/db/model.jsx');
var pgRawQuery = require('../helpers').pgRawQuery;

describe('Postgres', function() {
  let db;

  before(function(done) {
    pgRawQuery(`CREATE DATABASE ${config.connection.database}`, done);
  });

  after(function(done) {
    let p = Promise.resolve();
    if(db.connected()) {
      p = db.disconnect();
    }

    p.then(() => pgRawQuery(`DROP DATABASE ${config.connection.database}`, done))
      .catch(done);
  });

  describe('#disconnect()', function() {
    it('should not allow queries when #disconnect has been called', function(done) {
      db = new Pg(config);

      db.connect()
        .then(() => db.query('SELECT 1;'))
        .then(() => db.disconnect())
        .then(() => db.query('SELECT 1;'))
        .then(() => done(new Error('Allowed a query after #disconnect()')))
        .catch((e) => done());
    });
  });

  describe('Queries', function() {
    let model;
    let wrappedInsert;
    let queries;

    beforeEach(function() {
      db = new Pg(config);
      model = new Model(config);
      model.driver = db;
      wrappedInsert = (values) => {
        return () => model.insert(values);
      };
      queries = [
        { name: 'foobar1', 'applied': false, 'migration_time': new Date(2015, 0, 1, 1, 2, 3, 500), 'checksum': 'checksum'},
        { name: 'foobar2', 'applied': false, 'migration_time': new Date(2015, 0, 1, 1, 2, 3, 502), 'checksum': 'checksum'},
        { name: 'foobar3', 'applied': false, 'migration_time': new Date(2015, 0, 1, 1, 2, 3, 502), 'checksum': 'checksum'}
      ].map(wrappedInsert);
    });

    afterEach(function(done) {
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

    describe('#query()', function() {
      it('should run the given query', function(done) {
        const values = { name: 'foobar_query', 'applied': false, 'migration_time': new Date(2015, 0, 1, 1, 2, 3, 500), 'checksum': 'checksum'};

        db.connect()
          .then(() => model.insert(values))
          .then(() => model.findAllByName())
          .then((res) => {
            assert.deepEqual(res, [Object.assign({id: 1}, values)]);
            done();
          })
          .catch(done);
      });
    });

    describe('#transaction()', function() {
      it('should commit the transaction with valid queries', function(done) {
        db.connect()
          .then(() => db.transaction(queries))
          .then(() => model.countAll())
          .then((count) => {
            assert.equal(count, 3);
            done();
          })
          .catch(done);
      });

      it('should rollback the transaction with invalid queries', function(done) {
        queries[1] = wrappedInsert({ name: null, 'applied': false, 'migration_time': new Date(2015, 0, 1, 1, 2, 3, 502), 'checksum': 'checksum'});
        db.connect()
          .then(() => db.transaction(queries))
          .catch((e) => {
            assert.notEqual(e, undefined);
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
