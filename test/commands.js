import assert from 'assert';
import path from 'path';

import init from '../bin/commands/init';
import { snake } from '../lib/date';

const dir = snake(new Date());
const testDir = path.resolve('/tmp', 'sandbox', snake(new Date()));

describe('Commands', () => {
  before((done) => {
    mkdirp.sync(testDir);
  });

  describe('init', () => {
    it('should succeeed the when the directory is not a sardine project', (done) => {
      const conf = config([], testDir);
      init(conf)
        .then(done)
        .catch(done);
    });
  });
});
