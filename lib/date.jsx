import { twoDigits } from './util';

export function paddedDateList(date) {
  const list = [date.getFullYear().toString(), date.getMilliseconds().toString()];
  list.splice(1, 0, ...[
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ].map(twoDigits));

  return list;
}

export function snake(date) {
  const [year, month, day, hours, minutes, seconds] = paddedDateList(date);
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}
