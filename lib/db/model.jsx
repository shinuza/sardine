import Promise from 'bluebird';

import Types from './types';
import drivers from './drivers';

class Model {

  fields: {
    name: Types.String,
    applied: Types.Boolean,
    migration_time: Types.DateTime,
    checksum: Types.String
  }

  constructor(config) {
    const { driver } = config;
    const Driver = drivers[driver];

    if(!Driver) {
      throw new ReferenceError(`Unknown driver ${driver}`);
    }

    this.driver = new Driver(config);
    this.typeWrapper = new Types.TypeWrapper(driver);
    // If the configuration is customized by the driver we need these modifications
    this.config = this.driver.config;
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
    const { name, applied, migration_time, checksum } = values; // eslint-disable-line camelcase

    return this.connect()
      .then(() => {
        return this.driver.query(
          `INSERT INTO ${this.driver.getTableName()} (name, applied, migration_time, checksum) VALUES (?, ?, ?, ?)`,
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
        this.driver.query(`UPDATE ${this.driver.getTableName()} SET applied = ? WHERE name = ?`, [applied, name]));
  }

  findAllByName() {
    return this.connect()
      .then(() => this.driver.query(`SELECT * FROM ${this.driver.getTableName()} ORDER BY name`));
  }

  countAll() {
    return this.connect()
      .then(() => this.driver.query(`SELECT COUNT(*) AS count FROM ${this.driver.getTableName()}`))
      .then(([res]) => res.count);
  }

  dropTable() {
    return this.connect()
      .then(() => this.driver.query(`DROP TABLE ${this.driver.getTableName()}`));
  }

  findLastAppliedMigrations(limit) {
    return this.connect()
      .then(() => {
        let query = `SELECT * FROM ${this.driver.getTableName()} WHERE applied = true ORDER BY migration_time DESC`;
        if(limit) {
          query = query + ` LIMIT 1`;
        }
        return this.driver.query(query);
      });
  }
}

export default Model;
