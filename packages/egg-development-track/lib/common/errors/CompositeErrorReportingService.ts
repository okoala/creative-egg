
'use strict';

import { IErrorReportingService } from './IErrorReportingService';
import { IGlimpseError } from './IGlimpseError';

export class CompositeErrorReportingService implements IErrorReportingService {

    private errorServices: IErrorReportingService[];
    constructor(services: IErrorReportingService[]) {
        this.errorServices = services;
    }

    public reportError(error: IGlimpseError, ...params): void {
        if (this.errorServices) {
            this.errorServices.forEach((service) => {
                try {
                    service.reportError(error, ...params);
                }
                catch (err) {
                    /* failed reporting an error.  What do we do? */
                    console.error('Failed sending an error.  Error is ' + err);
                }
            });
        }
    }
}
