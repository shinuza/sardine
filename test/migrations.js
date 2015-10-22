var assert = require('assert');
var Migrations = require('../lib/migrations.jsx');
var errors = require('../lib/errors.jsx');
const join = require('path').join;

describe('Migrations', function() {
  describe('#isLastest()', function() {
    it('detect the latest migration', function() {
      const migrations = new Migrations('');
      migrations.discovered = [{name: 'foo'}, {name: 'bar'}];

      assert.equal(true,  migrations._isLatest({name: 'bar'}));
      assert.equal(false,  migrations._isLatest({name: 'foo'}));
    });
  });

  describe('@checkIntegrity', function() {
    it('it should detect missing down', function() {
      assert.throws(function() {
        Migrations.checkIntegrity([{filename: 1}, {filename: 2}], [{filename: 2}]);
      }, errors.IntegrityError);
    });

    it('it should detect missing up', function() {
      assert.throws(function() {
        Migrations.checkIntegrity([{filename: 2}], [{filename: 1}, {filename: 2}]);
      }, errors.IntegrityError);
    });

    it('it should detect missmatched filename', function() {
      Migrations.checkIntegrity([{filename: 1}, {filename: 2}], [{filename: 1}, {filename: 2}]);
      assert.throws(function() {
        Migrations.checkIntegrity([{filename: 1}, {filename: 2}], [{filename: 1}, {filename: 3}]);
      }, errors.IntegrityError);
    });
  });

  describe('#create(suffix)', function() {
    it('should return paths for a given date and suffix', function(done) {
      const migrations = new Migrations('./fixtures/migrations');
      const rootDir = '20150210_221003_foobar';
      const expected = {
        up: join(rootDir, 'up'),
        down: join(rootDir, 'down'),
        rootDir
      };

      migrations.create(new Date(2015, 1, 10, 22, 10, 3), 'foobar').then((paths) => {
        assert.deepEqual(paths, expected);
        done();
      });
    });
  });
});
