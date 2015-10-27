import assert from 'assert';

import { TypeWrapper } from '../../lib/db/types.jsx';

describe('types', () => {
  const date = new Date(2015, 2, 4, 20, 12, 23, 200);
  const bool = true;
  const str = 'foobar';

  describe('pg', () => {
    const type = new TypeWrapper('pg');

    it('should convert the given date to a value usable by the pg driver', () => {
      assert.equal(type.dateTime(date).toSQL(), '2015-03-04 20:12:23.200');
    });

    it('should convert the given bool to a value usable by the pg driver', () => {
      assert.equal(type.boolean(bool).toSQL(), true);
    });

    it('should convert the given str to a value usable by the pg driver', () => {
      assert.equal(type.string(str).toSQL(), 'foobar');
    });
  });

  describe('sqlite3', () => {
    const type = new TypeWrapper('sqlite3');

    it('should convert the given date to a value usable by the sqlite3 driver', () => {
      assert.equal(type.dateTime(date).toSQL(), '2015-03-04 20:12:23.200');
    });

    it('should convert the given bool to a value usable by the sqlite3 driver', () => {
      assert.equal(type.boolean(bool).toSQL(), true);
    });

    it('should convert the given str to a value usable by the sqlite3 driver', () => {
      assert.equal(type.string(str).toSQL(), 'foobar');
    });
  });

  describe('mysql', () => {
    const type = new TypeWrapper('mysql');

    it('should convert the given date to a value usable by the mysql driver', () => {
      assert.equal(type.dateTime(date).toSQL(), '2015-03-04 20:12:23.200');
    });

    it('should convert the given bool to a value usable by the mysql driver', () => {
      assert.equal(type.boolean(bool).toSQL(), 1);
    });

    it('should convert the given str to a value usable by the mysql driver', () => {
      assert.equal(type.string(str).toSQL(), 'foobar');
    });
  });
});
