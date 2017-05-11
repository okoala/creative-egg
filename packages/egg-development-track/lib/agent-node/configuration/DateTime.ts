'use strict';

import { DateTimeValue } from './DateTimeValue';
import { IDateTime } from './IDateTime';

import moment = require('moment');

export interface INowFactory {
    time: () => moment.Moment;
    offset: () => number[];
}

export class DateTime implements IDateTime {
    private nowFactory: INowFactory;

    public constructor(nowFactory?: INowFactory) {
        this.nowFactory = nowFactory || { time: moment, offset: process.hrtime};
    }

    public get now(): DateTimeValue {
        return DateTimeValue.fromMomentAndHRTime(this.nowFactory.time(), process.hrtime());
    }
}
