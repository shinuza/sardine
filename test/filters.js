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

      const filter = filters.update(recorded);
      assert.deepEqual(discovered.filter(filter), expected);
    });
  });
});
