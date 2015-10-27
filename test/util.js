import assert from 'assert';

import * as util from '../lib/util.jsx';

describe('Util', () => {
  describe('#twoDigits()', () => {
    it('should return the given digit padded with a zero', () => {
      assert.equal(util.twoDigits(2), '02');
    });
  });
});
