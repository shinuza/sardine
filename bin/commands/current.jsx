import { identity } from 'lodash';
import { green } from 'colors/safe';

import Migrations from '../../lib/migrations';

function current(config) {
  const migrations = new Migrations(config);

  return Promise.all([migrations.discover(), migrations.model.findAllByName()])
    .then(([discovered, recorded]) => {
      const lines = migrations
        .state(discovered, recorded)
        .map((m) => {
          const prefix = m.current ? '*' : ' ';
          const fn = [identity, green][Number(m.current)];

          return `${prefix} ${fn(m.name)}`;
        });

      console.log(lines.join('\n'));
    })
    .then(migrations.destroy);
}

export default current;
