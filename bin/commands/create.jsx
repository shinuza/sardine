import { resolve } from 'path';

import _ from 'lodash';
import mkdirp from 'mkdirp';
import pgp from 'pg-promise';

import Migrations from '../../lib/migrations';
import { snakeDate } from '../../lib/util';
import { UndefinedConfiguration }  from '../../lib/errors';
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
      return directory;
    })
    .then((directory) => {
      return (new Migrations(directory))
        .getUpdateBatch()
        .then(({ batch, recorded }) => {
          if(!batch.length) {
            mkdirp.sync(resolve(directory, dir, 'up'));
            mkdirp.sync(resolve(directory, dir, 'down'));

            return showInfo(`Created ${resolve(directory, dir)}`);
          } else {
            showError('You can only edit one new migration at the time, run "sardine up" before creating a new one');
          }
        });
      })
      .catch((e) => {
        showError(e.stack || e.message);
        process.exitCode = 1;
      })
      .then(pgp.end);
}

export default create;
