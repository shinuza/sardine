var assert = require('assert');
var TypeWrapper = require('../../lib/db/types.jsx').TypeWrapper;

describe('types', function() {
    const date = new Date(2015, 2, 4, 20, 12, 23, 200);
    const bool = true;
    const str = 'foobar';

  describe('pg', function() {
    const type = new TypeWrapper('pg');

    it('should convert the given date to a value usable by the pg driver', function() {
      assert.equal(type.DateTime(date).toSQL(), '2015-03-04 20:12:23.200');
    });

    it('should convert the given bool to a value usable by the pg driver', function() {
      assert.equal(type.Boolean(bool).toSQL(), true);
    });

    it('should convert the given str to a value usable by the pg driver', function() {
      assert.equal(type.String(str).toSQL(), 'foobar');
    });
  });

  describe('sqlite3', function() {
    const type = new TypeWrapper('sqlite3');

    it('should convert the given date to a value usable by the sqlite3 driver', function() {
      assert.equal(type.DateTime(date).toSQL(), '2015-03-04 20:12:23.200');
    });

    it('should convert the given bool to a value usable by the sqlite3 driver', function() {
      assert.equal(type.Boolean(bool).toSQL(), true);
    });

    it('should convert the given str to a value usable by the sqlite3 driver', function() {
      assert.equal(type.String(str).toSQL(), 'foobar');
    });
  });

  describe('mysql', function() {
    const type = new TypeWrapper('mysql');

    it('should convert the given date to a value usable by the mysql driver', function() {
      assert.equal(type.DateTime(date).toSQL(), '2015-03-04 20:12:23.200');
    });

    it('should convert the given bool to a value usable by the mysql driver', function() {
      assert.equal(type.Boolean(bool).toSQL(), 1);
    });

    it('should convert the given bool to a value usable by the mysql driver', function() {
      assert.equal(type.String(str).toSQL(), 'foobar');
    });
  });
});
