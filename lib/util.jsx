import { createHash } from 'crypto';
import _ from 'lodash';

function twoDigits(num) {
  return _.padLeft(num, 2, '0');
}

function snakeDate(date) {
  const year = date.getFullYear();
  const [month, day, hours, minutes, seconds] = [
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ].map(twoDigits);

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

function checksum(...descrim) {
  const shasum = createHash('sha1');
  descrim.forEach((part) => shasum.update(part));
  return shasum.digest('hex');
}

export default { checksum, snakeDate, twoDigits };
