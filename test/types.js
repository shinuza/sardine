var assert = require('assert');
var Types = require('../lib/db/types.jsx');

describe('types', function() {
  describe('#DateTime()', function() {
    const date = new Types.DateTime(new Date(2015, 2, 4, 20, 12, 23, 200));

    it('should return the correct value for the sqlite3 driver', function() {
      assert.equal(date.value('sqlite3'), '2015-03-04 20:12:23.200');
    });

    it('should return the correct value for the pg driver', function() {
      assert.equal(date.value('pg'), '2015-03-04 20:12:23.200');
    });

    it('should return the correct value for the mysql driver', function() {
      assert.equal(date.value('mysql'), '2015-03-04 20:12:23.200');
    });
  });

  describe('#Boolean()', function() {
    const boolFalse = new Types.Boolean(false);
    const boolTrue = new Types.Boolean(true);

    it('should return the correct value for the sqlite3 driver', function() {
      assert.equal(boolFalse.value('sqlite3'), 'false');
      assert.equal(boolTrue.value('sqlite3'), 'true');
    });

    it('should return the correct value for the pg driver', function() {
      assert.equal(boolFalse.value('pg'), 'false');
      assert.equal(boolTrue.value('pg'), 'true');
    });

    it('should return the correct value for the mysql driver', function() {
      assert.equal(boolFalse.value('mysql'), 0);
      assert.equal(boolTrue.value('mysql'), 1);
    });
  });

  describe('#String()', function() {
    const str = new Types.String('test string');

    it('should return the correct value for the sqlite3 driver', function() {
      assert.equal(str.value('sqlite3'), 'test string');
    });

    it('should return the correct value for the pg driver', function() {
      assert.equal(str.value('pg'), 'test string');
    });

    it('should return the correct value for the mysql driver', function() {
      assert.equal(str.value('mysql'), 'test string');
    });
  });

  describe('#Type()', function() {
    it('should be bound to a driver and convert the data accordingly', function() {
      const type = new Types.TypeWrapper('mysql');
      assert.strictEqual(type.Boolean(true), 1);
    });
  });
});
