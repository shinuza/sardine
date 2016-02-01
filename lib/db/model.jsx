import Types from './types';
import drivers from './drivers';

class Model {

  fields: {
    name: Types.String,
    applied: Types.Boolean,
    migration_time: Types.DateTime,
    checksum: Types.String,
  };

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

  query() {
    return this.driver.query.apply(this.driver, arguments);
  }

  transaction() {
    return this.driver.transaction.apply(this.driver, arguments);
  }

  insert(values) {
    const { name, applied, migration_time, checksum } = values; // eslint-disable-line camelcase

    return this.query(
      `INSERT INTO ${this.driver.getTableName()} (name, applied, migration_time, checksum) VALUES (?, ?, ?, ?)`,
      [
        this.typeWrapper.string(name).toSQL(),
        this.typeWrapper.boolean(applied).toSQL(),
        this.typeWrapper.dateTime(migration_time).toSQL(),
        this.typeWrapper.string(checksum).toSQL(),
      ]);
  }

  update(values) {
    const { name, applied } = values;

    return this.query(`UPDATE ${this.driver.getTableName()} SET applied = ? WHERE name = ?`, [applied, name]);
  }

  findAllByName() {
    return this.query(`SELECT * FROM ${this.driver.getTableName()} ORDER BY name`);
  }

  countAll() {
    return this.query(`SELECT COUNT(*) AS count FROM ${this.driver.getTableName()}`)
      .then(([{ count }]) => count);
  }

  dropTable() {
    return this.query(`DROP TABLE ${this.driver.getTableName()}`);
  }

  findLastAppliedMigrations(limit) {
    let sql = `SELECT * FROM ${this.driver.getTableName()} WHERE applied = true ORDER BY migration_time DESC`;
    if(limit) {
      sql = sql + ` LIMIT 1`;
    }
    return this.query(sql);
  }
}

export default Model;
