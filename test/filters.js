import assert from 'assert';

import * as filters from '../lib/filters.jsx';

describe('Filters', () => {
  describe('#update()', () => {
    it('should resolve updating migrations', () => {
      const discovered = [
        { name: 'foo' },
        { name: 'bar' },
        { name: 'baz' },
      ];
      const recorded = [
        { name: 'foo', applied: true },
        { name: 'bar', applied: false },
      ];
      const expected = [
        { name: 'bar' },
        { name: 'baz' },
      ];

      assert.deepEqual(filters.update(discovered, recorded), expected);
    });
  });

  describe('#rollback', () => {
    it('should resolve migrations to rollback', () => {
      const discovered = [
        { name: 'foo' },
        { name: 'bar' },
        { name: 'baz' },
      ];
      const recorded = [
        { name: 'foo', applied: true },
        { name: 'bar', applied: false },
      ];
      const expected = [
        { name: 'foo' },
      ];

      assert.deepEqual(filters.rollback(discovered, recorded), expected);
    });
  });

  describe('#current', () => {
    it('should return the current migration', () => {
      const discovered = [
        { name: 'foo' },
        { name: 'bar' },
        { name: 'baz' },
      ];
      const recorded = [
        { name: 'foo', applied: true },
        { name: 'bar', applied: true },
      ];
      const expected = { name: 'bar' };

      assert.deepEqual(filters.current(discovered, recorded), expected);
    });

    it('should return the first migration if none were applied', () => {
      const discovered = [
        { name: 'foo' },
        { name: 'bar' },
        { name: 'baz' },
      ];
      const recorded = [
        { name: 'foo', applied: false },
        { name: 'bar', applied: false },
      ];
      const expected = { name: 'foo' };

      assert.deepEqual(filters.current(discovered, recorded), expected);
    });

    it('should return the first migration if none were recorded', () => {
      const discovered = [
        { name: 'foo' },
        { name: 'bar' },
        { name: 'baz' },
      ];
      const recorded = [];
      const expected = { name: 'foo' };

      assert.deepEqual(filters.current(discovered, recorded), expected);
    });
  });
});
