var assert = require('assert');
var Migrations = require('../lib/migrations.jsx');


describe('Migrations', function() {
  describe('#isLastest()', function() {
    it('detect the latest migration', function() {
      const migrations = new Migrations('');
      migrations.discovered = [{name: 'foo'}, {name: 'bar'}];

      assert.equal(true,  migrations._isLatest({name: 'bar'}));
      assert.equal(false,  migrations._isLatest({name: 'foo'}));
    });
  });
});
