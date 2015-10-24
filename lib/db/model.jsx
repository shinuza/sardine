import Promise from 'bluebird';

import { TypeWrapper } from './types';
import drivers from './drivers';

export default class Model {

  fields: {
    name: types.String,
    applied: types.Boolean,
    migration_time: types.DateTime,
    checksum: types.String
  }

  constructor(configuration) {
    const { driver, connection } = configuration
    const Driver = drivers[driver];

    if(!Driver) {
      throw new ReferenceError(`Unknown driver ${Driver}`);
    }

    this.configuration = configuration;
    this.driver = new Driver(configuration);
    this.typeWrapper = new TypeWrapper(driver);
  }

  connect() {
    if(this.driver.connected()) {
      return Promise.resolve();
    }

    return this.driver.connect();
  }

  insert(values) {
    const { name, applied, migration_time, checksum } = values;

    return this.connect()
      .then(() => {
        return this.driver.query(`INSERT INTO ${this.configuration.tableName} (name, applied, migration_time, checksum) VALUES (?, ?, ?, ?)`,
        [
          this.typeWrapper.String(name).toSQL(),
          this.typeWrapper.Boolean(applied).toSQL(),
          this.typeWrapper.DateTime(migration_time).toSQL(),
          this.typeWrapper.String(checksum).toSQL(),
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
