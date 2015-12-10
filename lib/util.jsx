import { createHash } from 'crypto';
import { basename } from 'path';

import _ from 'lodash';

import { IntegrityError, MigrationNotFound } from './errors';

function twoDigits(num) {
  return _.padLeft(num, 2, '0');
}

function checksum(...descrim) {
  const shasum = createHash('sha1');
  descrim.forEach((part) => shasum.update(part));
  return shasum.digest('hex');
}

function checkIntegrity(ups, downs, name) {
  _.zip(ups, downs).forEach(([up, down]) => {
    if(!down) {
      throw new IntegrityError(
        `${name}/up/${up.filename} has no "down" counterpart, this migration cannot be applied.`);
    }

    if(!up) {
      throw new IntegrityError(
        `${name}/down/${down.filename} has no "up" counterpart, this migration cannot be applied.`);
    }

    const upFilename = basename(up.filename);
    const downFilename = basename(down.filename);
    if(downFilename !== upFilename) {
      throw new IntegrityError(
         `${downFilename} and ${upFilename} should have the same filename`);
    }
  });
}

function getMigration(discovered, migrationName) {
  const target = _.find(discovered, (m) => _.contains(m.name, migrationName));

  if(!target) {
    throw new MigrationNotFound(`Migration "${migrationName}" not found`);
  }

  return target;
}

export default {
  checkIntegrity,
  checksum,
  getMigration,
  twoDigits,
};
