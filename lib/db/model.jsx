import Promise from 'bluebird';

import * as Types from './types';
import drivers from './drivers';

export default class Model {

  fields: {
    name: Types.String,
    applied: Types.Boolean,
    migration_time: Types.DateTime,
    checksum: Types.String
  }

  constructor(configuration) {
    const { driver } = configuration;
    const Driver = drivers[driver];

    if(!Driver) {
      throw new ReferenceError(`Unknown driver ${Driver}`);
    }

    this.configuration = configuration;
    this.driver = new Driver(configuration);
    this.typeWrapper = new Types.TypeWrapper(driver);
  }

  connect() {
    if(this.driver.connected()) {
      return Promise.resolve();
    }

    return this.driver.connect();
  }

  disconnect() {
    if(!this.driver.connected()) {
      return Promise.resolve();
    }

    return this.driver.disconnect();
  }

  query() {
    return this.driver.query.apply(this.driver, arguments);
  }

  transaction() {
    return this.driver.transaction.apply(this.driver, arguments);
  }

  insert(values) {
    const { name, applied, migration_time, checksum } = values; // eslint-disable camelCase

    return this.connect()
      .then(() => {
        return this.driver.query(
          `INSERT INTO ${this.configuration.tableName} (name, applied, migration_time, checksum) VALUES (?, ?, ?, ?)`,
          [
            this.typeWrapper.string(name).toSQL(),
            this.typeWrapper.boolean(applied).toSQL(),
            this.typeWrapper.dateTime(migration_time).toSQL(),
            this.typeWrapper.string(checksum).toSQL(),
          ]);
      });
  }

  update(values) {
    const { name, applied } = values;
    return this.connect()
      .then(() =>
        this.driver.query(`UPDATE ${this.configuration.tableName} SET applied = ? WHERE name = ?`, [applied, name]));
  }

  findAllByName() {
    return this.connect()
      .then(() => this.driver.query(`SELECT * FROM ${this.configuration.tableName} ORDER BY name`));
  }

  countAll() {
    return this.connect()
      .then(() => this.driver.query(`SELECT COUNT(*) AS count FROM ${this.configuration.tableName}`))
      .then(([res]) => res.count);
  }

  dropTable() {
    return this.connect()
      .then(() => this.driver.query(`DROP TABLE ${this.configuration.tableName}`));
  }

  findLastAppliedMigrations(limit) {
    return this.connect()
      .then(() => {
        let query = `SELECT * FROM ${this.configuration.tableName} WHERE applied = true ORDER BY migration_time DESC`;
        if(limit) {
          query = query + ` LIMIT 1`;
        }
        return this.driver.query(query);
      });
  }

}
