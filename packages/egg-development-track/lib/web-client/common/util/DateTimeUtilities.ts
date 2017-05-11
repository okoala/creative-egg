const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
const timeOptions = { hour: '2-digit', minute: '2-digit' };

const dateFormat = new Intl.DateTimeFormat(navigator.language, dateOptions);
const timeFormat = new Intl.DateTimeFormat(navigator.language, timeOptions);

export function getTime(value) {
    return timeFormat.format(new Date(value));
}

export function getDate(value) {
    return dateFormat.format(new Date(value));
}



// WEBPACK FOOTER //
// ./src/client/common/util/DateTimeUtilities.ts