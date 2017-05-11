'use strict';

import moment = require('moment');

export interface IRequestFilters {
    durationMinimum?: number;
    durationMaximum?: number;
    urlContains?: string;
    methodList?: string[];
    statusCodeMinimum?: number;
    statusCodeMaximum?: number;
    tagList?: string[];
    requestTimeBefore?: moment.Moment;
    userId?: string;
}
