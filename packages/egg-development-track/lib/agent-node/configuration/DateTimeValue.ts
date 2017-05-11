'use strict';

import moment = require('moment');

export class DateTimeValue {
    public constructor(private value: moment.Moment, private offset: number) {
    }

    public static fromUnixMillisecondTimestamp(unixTimeStamp: number, hrTime: number[] ): DateTimeValue {
        const ns = hrTime[0] * 1e9 + hrTime[1];
        return new DateTimeValue(moment('' + unixTimeStamp, 'x'), ns);
    }

    public static fromMomentAndHRTime(m: moment.Moment, hrTime: number[]) {
        const ns = hrTime[0] * 1e9 + hrTime[1];
        return new DateTimeValue(m, ns);
    }

    public diff(value: DateTimeValue): number {
        const thisOffset = this.offset;
        const valueOffset = value.offset;

        return (thisOffset - valueOffset) / 1e6;
    }

    public getUnixTimestamp() {
        return this.value.valueOf();
    }

    public getMoment() {
        return this.value;
    }

    public getOffset() {
        return this.offset;
    }

    public format(includeUTCOffset: boolean = true): string {
        // equivalent to this.value.format('YYYY-MM-DDTHH:mm:ss.SSS ZZ') with UTC offset 
        // or this.value.format('YYYY-MM-DDTHH:mm:ss.SSS') without UTC offset  
        const m = this.value;
        let rtrn = m.year() + '-' +
            DateTimeValue.toTwoDigits(m.month() + 1) + '-' +
            DateTimeValue.toTwoDigits(m.date()) + 'T' +
            DateTimeValue.toTwoDigits(m.hour()) + ':' +
            DateTimeValue.toTwoDigits(m.minute()) + ':' +
            DateTimeValue.toTwoDigits(m.second()) + '.' +
            DateTimeValue.toThreeDigits(m.millisecond());

        if (includeUTCOffset) {
            // NOTE: We include the offset colon ('Z' format) as Safari won't parse timestamps using 'ZZ' format.
            rtrn += this.getUTCOffset(true);
        }

        return rtrn;
    }

    public getUTCOffset(includeColon: boolean = true) {
        // equivalent to moment().format('Z') or moment().format('ZZ') (with/without colon respectively).
        let offset = this.value.utcOffset();
        const sign = (offset >= 0) ? '+' : '-';
        offset = Math.abs(offset);
        const hours = DateTimeValue.toTwoDigits(Math.floor(offset / 60));
        const minutes = DateTimeValue.toTwoDigits(offset % 60);
        let rtrn;
        if (includeColon) {
            rtrn = sign + hours + ':' + minutes;
        }
        else {
            rtrn = sign + hours + minutes;
        }
        return rtrn;
    }

    private static toTwoDigits(value: Number) {
        return value < 10 ? '0' + value : value;
    }

    private static toThreeDigits(value): string {
        if (value < 10) {
            return '00' + value;
        }

        if (value < 100) {
            return '0' + value;
        }

        return '' + value;
    }

}
