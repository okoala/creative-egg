'use strict';

import moment = require('moment');

export interface IRequestIndices {
    duration?: number;
    url?: string;
    method?: string;
    statusCode?: number;
    dateTime?: moment.Moment;
    userId?: string;
    tags?: string[];
}
