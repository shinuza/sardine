var assert = require('assert');
var util = require('../lib/date.jsx');


describe('Date', function() {
  describe('#paddedDateList()', function() {
    it('should create a list of padded date components', function() {
      var date = new Date(2015, 11, 9, 1, 3, 20, 500);
      assert.deepEqual(util.paddedDateList(date), ['2015', '12', '09', '01', '03', '20', '500']);
    });
  });

  describe('#snake()', function() {
    it('should create a date that is useable as a directory name', function() {
      var date = new Date(2015, 11, 9, 1, 3, 20);
      assert.equal(util.snake(date), '20151209_010320');
    });
  });
});
