import assert from 'assert';

import util from '../lib/util.jsx';
import errors from '../lib/errors';

describe('Util', () => {
  describe('#twoDigits()', () => {
    it('should return the given digit padded with a zero', () => {
      assert.equal(util.twoDigits(2), '02');
    });
  });
});
