import { identity } from 'lodash';
import { green } from 'colors/safe';

import Migrations from '../../lib/migrations';

export default function current(config) {
  const migrations = new Migrations(config);

  return Promise.all([migrations.discover(), migrations.model.findAllByName()])
    .then(([discovered, recorded]) => {
      const lines = migrations
        .state(discovered, recorded)
        .map((m) => `${m.current ? '*' : ' '} ${[identity, green][m.current + 0](m.name)}`);

      console.log(lines.join('\n'));
    })
    .then(() => migrations.destroy());
}
