import { paddedDateList } from '../date';

const types = {};

class BaseType {
  constructor(driver, value) {
    this.driver = driver;
    this.value = value;
  }

  toSQL() {
    const fn = this[this.driver] || this.default;
    return fn.call(this).toSQL(this.value);
  }

  toJS(value) {
    const fn = this[this.driver] || this.default;
    return fn.call(this).toJS(this.value);
  }
}

types.Boolean = class Boolean extends BaseType {
  default(value) {
    const self = this;
    return {
      toSQL: () => {
        return self.value;
      },

      toJS: () => {
        return self.value;
      }
    }
  }

  mysql(value) {
    const self = this;
    return {
      toSQL: () => {
        return self.value + 0;
      },

      toJS: () => {
        return !!self.value;
      }
    }
  }
};

types.String = class String extends BaseType {
  default() {
    const self = this;
    return {
      toSQL: () => {
        return self.value.toString();
      },

      toJS: () => {
        return self.value;
      }
    }
  }
};

types.DateTime = class DateTime extends BaseType {
  default() {
    const self = this;
    return {
      toSQL: () => {
        const [year, month, day, hours, minutes, seconds, ms] = paddedDateList(self.value);
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
      },

      toJS: () => {
        return self.value;
      }
    }
  }
};

export default class Wrapper {
  constructor(driver) {
    this.driver = driver;

    this.DateTime = (value) => new types.DateTime(this.driver, value);
    this.String = (value) => new types.String(this.driver, value);
    this.Boolean = (value) => new types.Boolean(this.driver, value);
  }
};
