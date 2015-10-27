var assert = require('assert');

var pg = require('sqlite3');

var Migrations = require('../../../lib/migrations.jsx');
var Model = require('../../../lib/db/model.jsx')
var errors = require('../../../lib/errors.jsx');

describe('sqlite3-migrations', function() {
  var migrations;
  var config = require('../../testConfig/sqlite3');

  describe('#up()', function() {
    it('should throw when the batch is empty', function() {
      migrations = new Migrations(config);
      assert.throws(function() {
        migrations.up({ batch: [], recorded: [] });
      }, errors.EmptyBatchError);
    });

    it('should create the given tables', function(done) {
      migrations = new Migrations(config);
      const batch = [
        {'name': 'v1', checksum: 'v1_checksum', steps: 3, up: {
          files: [
            {filename: '01_foo.sql', contents: 'CREATE TABLE foo1("id" INTEGER PRIMARY KEY AUTOINCREMENT);'},
            {filename: '02_foo.sql', contents: 'CREATE TABLE foo2("id" INTEGER PRIMARY KEY AUTOINCREMENT);'},
            {filename: '03_foo.sql', contents: 'CREATE TABLE foo3("id" INTEGER PRIMARY KEY AUTOINCREMENT);'},
          ]
        }},
      ];
      migrations.discovered = batch;
      migrations.up({ batch, recorded: [] })
        .then(() => migrations.model.driver.query('SELECT 1 from foo1, foo2, foo3'))
        .then(() => done())
        .catch(done);
    });
  });

  describe('#down()', function() {
    it('should throw when the batch is empty', function() {
      const migrations = new Migrations(config);
      assert.throws(function() {
        migrations.down({ batch: [], recorded: [] });
      }, errors.EmptyBatchError);
    });
  });
});
