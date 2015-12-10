import assert from 'assert';

import Promise from 'bluebird';
import rimraf from 'rimraf';

import config from '../../testConfig/sqlite3';
import SQLite3 from '../../../lib/db/drivers/sqlite3';
import Model from '../../../lib/db/model';
import errors from '../../../lib/errors';

const rmrfAsync = Promise.promisify(rimraf);

describe('SQLite3', () => {
  const removeSqliteDb = () => rmrfAsync(config.connection.path);
  before('Removing database file', removeSqliteDb);
  after('Removing database file', removeSqliteDb);

  describe('Queries', () => {
    let db;
    let model;
    let wrappedInsert;
    let queries;

    beforeEach(() => {
      db = new SQLite3(config);
      model = new Model(config);
      model.driver = db;
      wrappedInsert = (values, index) => {
        const { name, applied, migration_time, checksum } = values; // eslint-disable-line camelcase

        return {
          path: `Script number ${index}`,
          sql: `
            INSERT INTO
              ${model.driver.getTableName()} (name, applied, migration_time, checksum)
            VALUES (?, ?, ?, ?)`,
          params: [
            model.typeWrapper.string(name).toSQL(),
            model.typeWrapper.boolean(applied).toSQL(),
            model.typeWrapper.dateTime(migration_time).toSQL(),
            model.typeWrapper.string(checksum).toSQL(),
          ],
        };
      };
      queries = [
        {
          name: 'foobar1',
          applied: false,
          migration_time: new Date(2015, 0, 1, 1, 2, 3, 500), // eslint-disable-line camelcase
          checksum: 'checksum',
        },
        {
          name: 'foobar2',
          applied: false,
          migration_time: new Date(2015, 0, 1, 1, 2, 3, 500), // eslint-disable-line camelcase
          checksum: 'checksum',
        },
        {
          name: 'foobar3',
          applied: false,
          migration_time: new Date(2015, 0, 1, 1, 2, 3, 500), // eslint-disable-line camelcase
          checksum: 'checksum',
        },
      ].map(wrappedInsert);
    });

    afterEach(() => model.dropTable());

    describe('#query()', () => {
      it('should execute the given query', () => {
        const values = {
          name: 'foobar_query',
          applied: false,
          migration_time: new Date(2015, 0, 1, 1, 2, 3, 500), // eslint-disable-line camelcase
          checksum: 'checksum',
        };

        return model.insert(values)
        .then(() => model.findAllByName())
        .then((res) => {
          assert.deepEqual(res, [{
            id: 1,
            name: 'foobar_query',
            applied: 0,
            migration_time: '2015-01-01 01:02:03.500',  // eslint-disable-line camelcase
            checksum: 'checksum',
          }]);
        });
      });
    });

    describe('#transaction()', () => {
      it('should commit the transaction with valid queries', () => {
        return db.transaction(queries)
        .then(() => model.countAll())
        .then((count) => assert.strictEqual(count, 3));
      });

      it('should rollback the transaction with invalid queries', () => {
        queries[1] = wrappedInsert({
          name: null,
          applied: false,
          migration_time: new Date(2015, 0, 1, 1, 2, 3, 502), // eslint-disable-line camelcase
          checksum: 'checksum',
        });

        return db.transaction(queries)
        .catch((e) => {
          assert.notEqual(e, void 0);
          assert.equal(e.code, errors.SQLITE.SQLITE_CONSTRAINT);
        })
        .then(() => model.countAll())
        .then((count) => assert.strictEqual(count, 0));
      });
    });
  });
});
