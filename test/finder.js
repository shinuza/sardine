import assert from 'assert';
import path from 'path';

import _ from 'lodash';

import Finder from '../lib/finder';

describe('Finder', () => {
  const finder = new Finder(path.resolve(__dirname, './sandbox/finder-tests'));
  const files = [
    '01_tables/01_table.sql',
    '01_tables/02_table.sql',
    '01_tables/03_table.sql',
    '02_types/01_types.sql',
    '02_types/02_types.sql',
    '02_types/03_types.sql',
    '03_procedures/01_proc.sql',
    '03_procedures/02_proc.sql',
    '03_procedures/03_proc.sql',
    'readme.sql',
  ];

  it('should not try to scan files in the migrations directory', () => {
    finder.discover().then((migrations) =>
      assert.deepEqual(_.pluck(migrations, 'name'), ['foobar'])
    );
  });

  it('should recursively scan files in the direction directories', () => {
    const migration = 'foobar';
    return finder.readDirections(migration).then(([up, down]) => {
      assert.deepEqual(_.pluck(up, 'filename'), files.map((file) => `${migration}/up/${file}`));
      assert.deepEqual(_.pluck(down, 'filename'), files.map((file) => `${migration}/down/${file}`));
    });
  });

  it('should compute the direction checksum', () => {
    const checksum = finder.directionChecksum([
      { filename: 'foo', contents: 'foo' },
      { filename: 'bar', contents: 'bar' },
      { filename: 'baz', contents: 'baz' },
    ]);
    assert.equal(checksum, '7ed6e5bab93528e8e557056327f660cfc751f833');
  });

  it('should return an empty string when given no files', () => {
    const checksum = finder.directionChecksum([]);
    assert.equal(checksum, '');
  });
});
