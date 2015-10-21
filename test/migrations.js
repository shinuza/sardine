var assert = require('assert');
var Migrations = require('../lib/migrations.jsx');
var errors = require('../lib/errors.jsx');

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
});
