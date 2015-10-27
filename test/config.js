import assert from 'assert';

import { checkKeys } from '../lib/config';
import { UndefinedConfiguration } from '../lib/errors';

describe('Config', () => {
  describe('#checkKeys()', () => {
    it('should return an error when a requested key is missing', () => {
      assert.throws(() => {
        checkKeys({ foo: true, bar: true, baz: true }, ['buz', 'boz']);
      }, UndefinedConfiguration);
    });
  });
});
