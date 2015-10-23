import { paddedDateList } from '../date';

const types = {};

class BaseType {
  constructor(value) {
    this._value = value;
  }

  value(driver) {
    return this[driver](this._value);
  }

  sqlite3() {
    return this.default();
  }

  pg() {
    return this.default();
  }

  mysql() {
    return this.default();
  }
}

types.Boolean = class Boolean extends BaseType {
  default() {
    return this._value === true ? 'true' : 'false';
  }

  mysql() {
    return this._value + 0;
  }
};

types.String = class String extends BaseType {
  default() {
    return this._value;
  }
};

types.DateTime = class DateTime extends BaseType {
  default() {
    const [year, month, day, hours, minutes, seconds, ms] = paddedDateList(this._value);
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
  }
};

types.TypeWrapper = class Type {
  constructor(driver) {
    this.driver = driver;
  }

  DateTime(value) {
    return new types.DateTime(value).value(this.driver);
  }

  String(value) {
    return new types.String(value).value(this.driver);
  }

  Boolean(value) {
    return new types.Boolean(value).value(this.driver);
  }
};

export default types;
