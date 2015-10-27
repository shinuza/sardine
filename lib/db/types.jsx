import { paddedDateList } from '../date';

class BaseType {
  constructor(driver, value) {
    this.driver = driver;
    this.value = value;
  }

  toSQL() {
    const fn = this[this.driver] || this.default;
    return fn.call(this).toSQL(this.value);
  }

  toJS() {
    const fn = this[this.driver] || this.default;
    return fn.call(this).toJS(this.value);
  }
}

export class BooleanType extends BaseType {
  default() {
    const self = this;
    return {
      toSQL: () => {
        return self.value;
      },

      toJS: () => {
        return self.value;
      },
    };
  }

  mysql() {
    const self = this;
    return {
      toSQL: () => {
        return self.value + 0;
      },

      toJS: () => {
        return !!self.value;
      },
    };
  }
}

export class StringType extends BaseType {
  default() {
    const self = this;
    return {
      toSQL: () => {
        if(self.value === null) {
          return null;
        }
        return self.value.toString();
      },

      toJS: () => {
        return self.value;
      },
    };
  }
}

export class DateTimeType extends BaseType {
  default() {
    const self = this;
    return {
      toSQL: () => {
        const [year, month, day, hours, minutes, seconds, ms] = paddedDateList(self.value);
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
      },

      toJS: () => {
        return self.value;
      },
    };
  }
}

export class TypeWrapper {
  constructor(driver) {
    this.driver = driver;

    this.dateTime = (value) => new DateTimeType(this.driver, value);
    this.string = (value) => new StringType(this.driver, value);
    this.boolean = (value) => new BooleanType(this.driver, value);
  }
}
