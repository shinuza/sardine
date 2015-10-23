import { MissingDependency } from '../../errors';

export default class Driver {

  getName() {
    throw new ReferenceError('Not implemented!');
  }

  getModule() {
    const name = this.getName();
    try {
      return require(name);
    }
    catch(e) {
      if(e.code === 'MODULE_NOT_FOUND') {
        throw new MissingDependency(
          `Cannot find module "${name}". You need to run "npm install ${name}" to install it.`);
      }
      throw e;
    }
  }

  query() {}

  transaction() {}

  close() {}
}
