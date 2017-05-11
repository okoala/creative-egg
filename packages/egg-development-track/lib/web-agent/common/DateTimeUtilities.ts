function toTwoDigits(value) {
  return value < 10 ? '0' + value : value;
}

function toThreeDigits(value) {
  if (value < 10) {
    return '00' + value;
  }

  if (value < 100) {
    return '0' + value;
  }

  return value;
}

function getUTCOffset(date) {
  let offset = date.getTimezoneOffset();
  const sign = (offset >= 0) ? '+' : '-';
  offset = Math.abs(offset);
  const hours = toTwoDigits(Math.floor(offset / 60));
  const minutes = toTwoDigits(offset % 60);
  return sign + hours + minutes;
}

// Convert time according to the format string: 'YYYY-MM-DDTHH:mm:ss.SSS ZZ'
// Output should look like: "2016-06-08T09:07:11.021 -0700"
export function getDateTime(d: Date = new Date()): string {
  return d.getFullYear() + '-' + toTwoDigits(d.getMonth() + 1) + '-' + toTwoDigits(d.getDate()) + 'T' +
    toTwoDigits(d.getHours()) + ':' + toTwoDigits(d.getMinutes()) + ':' + toTwoDigits(d.getSeconds()) + '.' +
    toThreeDigits(d.getMilliseconds()) + getUTCOffset(d);
}
