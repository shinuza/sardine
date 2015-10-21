import { resolve } from 'path';

import mkdirp from 'mkdirp';

import Migrations from '../../lib/migrations';
import { snakeDate } from '../../lib/util';
import { showError, showInfo } from '../util';

export default function create(config, suffix) {
  const date = snakeDate(new Date());
  const dir = `${date}_${suffix}`;
  const { directory } = config;

  return (new Migrations(directory))
    .getUpdateBatch()
    .then(({ batch }) => {
      if(!batch.length) {
        mkdirp.sync(resolve(directory, dir, 'up'));
        mkdirp.sync(resolve(directory, dir, 'down'));

        return showInfo(`Created ${resolve(directory, dir)}`);
      }
      showError('You can only edit one new migration at the time, run "sardine up" before creating a new one');
    });
}
