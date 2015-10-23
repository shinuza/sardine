var assert = require('assert');

var helpers = require('./helpers');
var SQLite3 = require('../lib/db/drivers/sqlite3.jsx');

describe('SQLite3', function() {
  describe('#query()', function() {
    it('should run the given query and create the migration database beforehand', function(done) {
      const db = new SQLite3({'path': ':memory:'});
      const values = { name: 'foobar', 'applied': false, 'migration_time': new Date(2015, 0, 1, 1, 2, 3, 500), 'checksum': 'checksum'};

      helpers.insert(db, values)
      .then(() => helpers.select(db))
      .then((res) => {
        assert.deepEqual(res, [{
          id: 1,
          name: 'foobar',
          applied: 'false',
          migration_time: '2015-01-01 01:02:03.500',
          checksum: 'checksum'
        }]);
        done();
      }).catch(done);
    });
  });
});
