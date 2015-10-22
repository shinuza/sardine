var assert = require('assert');
var Migrations = require('../lib/migrations.jsx');
var errors = require('../lib/errors.jsx');
const join = require('path').join;

describe('Migrations', function() {
  describe('#isLastest()', function() {
    it('detect the latest migration', function() {
      const migrations = new Migrations('');
      migrations.discovered = [{name: 'foo'}, {name: 'bar'}];

      assert.equal(true,  migrations._isLatest({name: 'bar'}));
      assert.equal(false,  migrations._isLatest({name: 'foo'}));
    });
  });

  describe('@checkIntegrity', function() {
    it('it should detect missing down', function() {
      assert.throws(function() {
        Migrations.checkIntegrity([{filename: 1}, {filename: 2}], [{filename: 2}]);
      }, errors.IntegrityError);
    });

    it('it should detect missing up', function() {
      assert.throws(function() {
        Migrations.checkIntegrity([{filename: 2}], [{filename: 1}, {filename: 2}]);
      }, errors.IntegrityError);
    });

    it('it should detect missmatched filename', function() {
      Migrations.checkIntegrity([{filename: 1}, {filename: 2}], [{filename: 1}, {filename: 2}]);
      assert.throws(function() {
        Migrations.checkIntegrity([{filename: 1}, {filename: 2}], [{filename: 1}, {filename: 3}]);
      }, errors.IntegrityError);
    });
  });

  describe('#create(suffix)', function() {
    it('should return paths for a given date and suffix', function() {
      const migrations = new Migrations('./fixtures/migrations');
      const rootDir = '20150210_221003_foobar';
      const expected = {
        up: join(rootDir, 'up'),
        down: join(rootDir, 'down'),
        rootDir
      };

      const paths = migrations.create(new Date(2015, 1, 10, 22, 10, 3), 'foobar');
      assert.deepEqual(paths, expected);
    });
  });

  describe('#step(migrationName, suffixes [, suffixes])', function() {
    it('should return paths for a given suffix and list of names given', function() {
      const migrations = new Migrations();
      migrations.discovered = [{name: '20150210_221003_foobar', steps: 2}, {name: '20150210_221203_fizzbuzz', steps: 0}];
      const expected = [
        join('20150210_221003_foobar', 'up', '03_baz.sql'),
        join('20150210_221003_foobar', 'up', '04_buz.sql'),
        join('20150210_221003_foobar', 'down', '03_baz.sql'),
        join('20150210_221003_foobar', 'down', '04_buz.sql')
      ];

      const paths = migrations.step('foobar', ['baz', 'buz']);
      assert.deepEqual(paths, expected);
    });

    it('should return null if the fuzzy search fails', function() {
      const migrations = new Migrations();
      migrations.discovered = [{name: '20150210_221003_foobar'}, {name: '20150210_221203_fizzbuzz'}];

      assert.throws(function() {
        migrations.step('notfound', ['baz', 'buz']);
      }, errors.MigrationNotFound);
    });
  });
});
