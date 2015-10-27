import assert from 'assert';

import Model from '../../lib/db/model';

describe('Model', () => {
  it('should throw an error with an unknown driver', () => {
    assert.throws(() => {
      void new Model({ driver: 'unknown' });
    }, ReferenceError);
  });
});
