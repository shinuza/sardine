var assert = require('assert');
var util = require('../lib/util.jsx');


describe('Util', function() {
  describe('#twoDigits()', function() {
    it('should return the given digit padded with a zero', function() {
      assert.equal(util.twoDigits(2), '02');
    });
  });

  describe('#snakeDate()', function() {
    it('should create a date that is useable as a directory name', function() {
      var date = new Date(2015, 11, 9, 1, 3, 20);
      assert.equal(util.snakeDate(date), '20151209_010320');
    });
  });
});
