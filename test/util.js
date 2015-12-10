import assert from 'assert';

import util from '../lib/util.jsx';
import errors from '../lib/errors';

describe('Util', () => {
  describe('#twoDigits()', () => {
    it('should return the given digit padded with a zero', () => {
      assert.equal(util.twoDigits(2), '02');
    });
  });

  describe('#checkIntegrity', () => {
    it('it should detect missing down', () => {
      assert.throws(() => {
        util.checkIntegrity([{ filename: 'foo.sql' }, { filename: 'bar.sql' }], [{ filename: 'foo.sql' }, void 0]);
      }, errors.IntegrityError);
    });

    it('it should detect missing up', () => {
      assert.throws(() => {
        util.checkIntegrity([{ filename: 2 }, void 0], [{ filename: 1 }, { filename: 2 }]);
      }, errors.IntegrityError);
    });

    it('it should detect missmatched filename', () => {
      util.checkIntegrity([{ filename: 1 }, { filename: 2 }], [{ filename: 1 }, { filename: 2 }]);
      assert.throws(() => {
        util.checkIntegrity([{ filename: 1 }, { filename: 2 }], [{ filename: 1 }, { filename: 3 }]);
      }, errors.IntegrityError);
    });
  });

  describe('#getMigration', () => {
    it('should fail when no migration matches the given name', () => {
      assert.throws(() => {
        util.getMigration([{ name: 'foobar' }, { name: 'fizz' }], 'buzz');
      }, errors.MigrationNotFound);
    });

    it('should return the matched migration', () => {
      const migration = util.getMigration([{ name: 'foobar' }, { name: 'fizz' }, { name: 'buzz' }], 'buzz');
      assert.deepEqual(migration, { name: 'buzz' });
    });
  });
});
