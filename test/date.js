import assert from 'assert';

import * as date from '../lib/date.jsx';

describe('Date', () => {
  describe('#paddedDateList()', () => {
    it('should create a list of padded date components', () => {
      const d = new Date(2015, 11, 9, 1, 3, 20, 500);
      assert.deepEqual(date.paddedDateList(d), ['2015', '12', '09', '01', '03', '20', '500']);
    });
  });

  describe('#snake()', () => {
    it('should create a date that is useable as a directory name', () => {
      const d = new Date(2015, 11, 9, 1, 3, 20);
      assert.equal(date.snake(d), '20151209_010320');
    });
  });
});
