import _ from 'lodash';
import { green } from 'colors/safe';

import Sardine from '../../lib';

function current(config) {
  const sardine = new Sardine(config);

  return sardine.current({
    default: (n) => `  ${n}`,
    current: (n) => `* ${green(n)}`,
    initial: (n) => `${_.capitalize(n)} state`,
  }).then((entries) => console.log(entries.join('\n')));
}

export default current;
