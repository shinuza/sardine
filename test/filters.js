var assert = require('assert');
var filters = require('../lib/filters.jsx');


describe('Filters', function() {
  describe('#update()', function() {
    it('should resolve updating migrations', function() {
      const discovered = [
        {name: 'foo'},
        {name: 'bar'},
        {name: 'baz'}
      ];
      const recorded = [
        {name: 'foo', applied: true},
        {name: 'bar', applied: false}
      ];
      const expected = [
        {'name': 'bar'},
        {'name': 'baz'}
      ]

      assert.deepEqual(filters.update(discovered, recorded), expected);
    });
  });

  describe('#rollback', function() {
    it('should resolve migrations to rollback', function() {
      const discovered = [
        {name: 'foo'},
        {name: 'bar'},
        {name: 'baz'}
      ];
      const recorded = [
        {name: 'foo', applied: true},
        {name: 'bar', applied: false}
      ];
      const expected = [
        {'name': 'foo'}
      ];

      assert.deepEqual(filters.rollback(discovered, recorded), expected);
    });
  });

  describe('#current', function() {
    it('should return the current migration', function() {
      const discovered = [
        {name: 'foo'},
        {name: 'bar'},
        {name: 'baz'}
      ];
      const recorded = [
        {name: 'foo', applied: true},
        {name: 'bar', applied: true},
      ];
      const expected = {'name': 'bar'}

      assert.deepEqual(filters.current(discovered, recorded), expected);
    });

    it('should return the first migration if none were applied', function() {
      const discovered = [
        {name: 'foo'},
        {name: 'bar'},
        {name: 'baz'}
      ];
      const recorded = [
        {name: 'foo', applied: false},
        {name: 'bar', applied: false},
      ];
      const expected = {'name': 'foo'}

      assert.deepEqual(filters.current(discovered, recorded), expected);
    });

    it('should return the first migration if none were recorded', function() {
      const discovered = [
        {name: 'foo'},
        {name: 'bar'},
        {name: 'baz'}
      ];
      const recorded = [];
      const expected = {'name': 'foo'}

      assert.deepEqual(filters.current(discovered, recorded), expected);
    });
  });
});
