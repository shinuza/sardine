var assert = require('assert');
var fs = require('fs');
var path = require('path');

var Promise = require('bluebird');

var Migrations = require('../lib/migrations.jsx');
var errors = require('../lib/errors.jsx');
var SARDINE_CONFIG = require('../lib/config').SARDINE_CONFIG;
var SANDBOX = path.resolve(__dirname, 'sandbox');

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
        up: path.join(rootDir, 'up'),
        down: path.join(rootDir, 'down'),
        rootDir
      };

      const paths = migrations.create(new Date(2015, 1, 10, 22, 10, 3), 'foobar');
      assert.deepEqual(paths, expected);
    });
  });

  describe('init(#config, path)', function() {
    after(function(done) {
      const f = path.resolve(SANDBOX, SARDINE_CONFIG);
      fs.unlink(f, done);
    });

    it('should create the sardineConfig file when it does not exist', function(done) {
      const migrations = new Migrations();
      const p = Promise.reject(new errors.MissingConfiguration('Yup, it failed'));

      migrations.on('init:success', () => {
        assert(require(path.resolve(SANDBOX, SARDINE_CONFIG)) !== undefined);
        done();
      });

      migrations.init(p, SANDBOX).catch(done);
    });

    it('should not create the sandineConfig file when it already exists', function(done) {
      const migrations = new Migrations();
      const p = Promise.resolve();

      migrations.on('init:success', () => {
        assert(false, 'Success was called');
        done();
      });
      migrations.on('init:noop', done);

      migrations.init(p, SANDBOX).catch(done);
    });
  });

  describe('#step(migrationName, suffixes [, suffixes])', function() {
    it('should return paths for a given suffix and list of names given', function() {
      const migrations = new Migrations();
      migrations.discovered = [{name: '20150210_221003_foobar', steps: 2}, {name: '20150210_221203_fizzbuzz', steps: 0}];
      const expected = [
        path.join('20150210_221003_foobar', 'up', '03_baz.sql'),
        path.join('20150210_221003_foobar', 'up', '04_buz.sql'),
        path.join('20150210_221003_foobar', 'down', '03_baz.sql'),
        path.join('20150210_221003_foobar', 'down', '04_buz.sql')
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

  describe('#state(discovered, recorded)', function() {
    it('should return a list of discovered migrations indicating if they are the current one or not', function() {
      const migrations = new Migrations();
      const discovered = [
        {name: '20150210_221003_foo'},
        {name: '20150210_221203_bar'},
        {name: '20150210_221003_buz'},
        {name: '20150210_221203_fizzbuzz'},
      ];
      const recorded = [
        {name: '20150210_221003_foo', applied: true},
        {name: '20150210_221203_bar', applied: true},
      ];

      const state = migrations.state(discovered, recorded);
      assert.deepEqual([
        {name: '20150210_221003_foo', current: false},
        {name: '20150210_221203_bar', current: true},
        {name: '20150210_221003_buz', current: false},
        {name: '20150210_221203_fizzbuzz', current: false},
      ], state);
    });
  });
});
