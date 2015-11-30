import assert from 'assert';
import fs from 'fs';
import path from 'path';

import Promise from 'bluebird';

import actions from '../lib/actions';
import errors from '../lib/errors';
import { SARDINE_CONFIG } from '../lib/config';

const SANDBOX = path.resolve(__dirname, 'sandbox');
const unlinkAsync = Promise.promisify(fs.unlink);

describe('Actions', () => {
  describe('#create(suffix)', () => {
    it('should return paths for a given date and suffix', () => {
      const rootDir = '20150210_221003_foobar';
      const expected = {
        up: path.join(rootDir, 'up'),
        down: path.join(rootDir, 'down'),
        rootDir,
      };

      const paths = actions.create(new Date(2015, 1, 10, 22, 10, 3), 'foobar');
      assert.deepEqual(paths, expected);
    });
  });

  describe('init(#config, path)', () => {
    const f = path.resolve(SANDBOX, SARDINE_CONFIG);

    after(() => unlinkAsync(f));

    it('should create the sardineConfig file when it does not exist', () => {
      const p = Promise.reject(new errors.MissingConfiguration('Yup, it failed'));

      return actions.init(p, SANDBOX)
        .then((created) => assert.equal(created, true));
    });

    it('should not create the sandineConfig file when it already exists', () => {
      const p = Promise.resolve();

      return actions.init(p, SANDBOX)
        .then((created) => assert.equal(created, false));
    });
  });

  describe('#step(migrationName, suffixes [, suffixes])', () => {
    it('should return paths for a given suffix and list of names given', () => {
      const discovered = [
        { name: '20150210_221003_foobar', steps: 2 },
        { name: '20150210_221203_fizzbuzz', steps: 0 },
      ];
      const expected = [
        path.join('20150210_221003_foobar', 'up', '03_baz.sql'),
        path.join('20150210_221003_foobar', 'up', '04_buz.sql'),
        path.join('20150210_221003_foobar', 'down', '03_baz.sql'),
        path.join('20150210_221003_foobar', 'down', '04_buz.sql'),
      ];

      const paths = actions.step(discovered, 'foobar', ['baz', 'buz']);
      assert.deepEqual(paths, expected);
    });

    it('should return null if the fuzzy search fails', () => {
      const discovered = [{ name: '20150210_221003_foobar' }, { name: '20150210_221203_fizzbuzz' }];
      assert.throws(() => {
        actions.step(discovered, 'notfound', ['baz', 'buz']);
      }, errors.MigrationNotFound);
    });
  });

  describe('#state(discovered, recorded)', () => {
    it('should return only the initial state when no migrations exist', () => {
      const discovered = [];
      const recorded = [];

      const state = actions.state(discovered, recorded);
      assert.deepEqual(state, [{ name: 'initial', initial: true, current: true }]);
    });

    it('should return a list of migrations with the initial one marked as current when none were applied', () => {
      const discovered = [{ name: '20150210_221003_foo' }];
      const recorded = [{ name: '20150210_221003_foo', applied: false }];

      const state = actions.state(discovered, recorded);
      assert.deepEqual([
        { name: 'initial', initial: true, current: true },
        { name: '20150210_221003_foo', current: false, initial: false },
      ], state);
    });

    it('should return a list of discovered migrations indicating if they are the current one or not', () => {
      const discovered = [
        { name: '20150210_221003_foo' },
        { name: '20150210_221203_bar' },
        { name: '20150210_221003_buz' },
        { name: '20150210_221203_fizzbuzz' },
      ];
      const recorded = [
        { name: '20150210_221003_foo', applied: true },
        { name: '20150210_221203_bar', applied: true },
      ];

      const state = actions.state(discovered, recorded);
      assert.deepEqual([
        { name: 'initial', current: false, initial: true },
        { name: '20150210_221003_foo', current: false, initial: false },
        { name: '20150210_221203_bar', current: true, initial: false },
        { name: '20150210_221003_buz', current: false, initial: false },
        { name: '20150210_221203_fizzbuzz', current: false, initial: false },
      ], state);
    });
  });
});
