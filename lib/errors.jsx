class MissingConfiguration extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
}

class UndefinedConfiguration extends Error {
  constructor(entry) {
    super();
    this.message = `"terConfig.${entry}" is undefined`;
  }
}

class IntegrityError extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
}

class MissingMigrationDirectory extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
}

class TransactionError extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
}

export default { MissingConfiguration, MissingMigrationDirectory, UndefinedConfiguration, TransactionError };
