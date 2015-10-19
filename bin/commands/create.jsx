import { resolve } from 'path';

import _ from 'lodash';
import mkdirp from 'mkdirp';

import { snakeDate } from '../../lib/util';
import { MissingConfiguration, UndefinedConfiguration }  from '../../lib/errors';
import { config } from '../../lib/config';
import { showError, showInfo } from '../util';

function create(suffix) {
  const date = snakeDate(new Date());
  const dir = `${date}_${suffix}`;

  config()
    .then((conf) => {
      const { directory } = conf;
      if(!directory) {
        throw new UndefinedConfiguration('directory');
      }
      mkdirp.sync(resolve(directory, dir, 'up'));
      mkdirp.sync(resolve(directory, dir, 'down'));

      showInfo(`Created ${resolve(directory, dir)}`);
    })
    .catch(MissingConfiguration, (e) => {
      showError(e.message);
    })
    .catch((e) => {
      showError(e.stack);
    });


}

export default create;
