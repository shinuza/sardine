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

class EmptyBatchError extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
}

const PG = {
  SYNTAX_ERROR: '42601',
  UNDEFINED_TABLE: '42P01',
  NOT_NULL_VIOLATION: '23502',
};

const SQLITE = {
  SQLITE_ERROR: 'SQLITE_ERROR',
  SQLITE_CONSTRAINT: 'SQLITE_CONSTRAINT',
};

export default {
  IntegrityError,
  MigrationNotFound,
  MissingDependency,
  MissingConfiguration,
  MissingMigrationDirectory,
  PendingMigrations,
  TransactionError,
  UndefinedConfiguration,
  EmptyBatchError,
  PG,
  SQLITE,
};
