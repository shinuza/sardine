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

export default { MissingConfiguration, UndefinedConfiguration };
