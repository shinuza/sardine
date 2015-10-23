import { createHash } from 'crypto';
import _ from 'lodash';

export function twoDigits(num) {
  return _.padLeft(num, 2, '0');
}

export function checksum(...descrim) {
  const shasum = createHash('sha1');
  descrim.forEach((part) => shasum.update(part));
  return shasum.digest('hex');
}
