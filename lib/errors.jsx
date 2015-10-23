class MissingConfiguration extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
}

class UndefinedConfiguration extends Error {
  constructor(message) {
    super();
    this.message = message;
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

class MissingDependency extends Error {
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

class PendingMigrations extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
}

class MigrationNotFound extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
}

export default {
  IntegrityError,
  MigrationNotFound,
  MissingDependency,
  MissingConfiguration,
  MissingMigrationDirectory,
  PendingMigrations,
  TransactionError,
  UndefinedConfiguration,
};
