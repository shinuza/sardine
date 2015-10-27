var assert = require('assert');
var util = require('../lib/util.jsx');


describe('Util', function() {
  describe('#twoDigits()', function() {
    it('should return the given digit padded with a zero', function() {
      assert.equal(util.twoDigits(2), '02');
    });
  });
});
