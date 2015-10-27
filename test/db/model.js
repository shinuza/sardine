var assert = require('assert');
var Model = require('../../lib/db/model');

describe('Model', function() {
    it('should throw an error with an unknown driver', function() {
      assert.throws(function() {
        new Model({driver: 'unknown'});
      }, ReferenceError);
    });
});
