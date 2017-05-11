
'use strict';

import * as util from 'util';
import { IErrorReportingService } from './IErrorReportingService';
import { IGlimpseError } from './IGlimpseError';
import { ITelemetryService, IProperties, IMeasurements } from '../telemetry/TelemetryService';
import { TelemetryEvents } from '../telemetry/TelemetryEvents';
import { getSlugForErrorCode } from './ErrorCodes';

export class TelemetryErrorReportingService implements IErrorReportingService {

    private telemetryService: ITelemetryService;

    constructor(telemetryService: ITelemetryService) {
        this.telemetryService = telemetryService;
    }

    public reportError(error: IGlimpseError, ...params): void {

        if (this.telemetryService.isEnabled) {

            const measurements: IMeasurements = {};
            const properties: IProperties = {
                // fill in a 'stack' property on the properties object
                stack: new Error().stack,
                severity: '' + error.severity,
                errorClass: '' + error.errorClass,
                errorCode:  '' + error.errorCode,
                errorSlug: getSlugForErrorCode(error.errorCode),
                message: util.format(error.message, ...params)
            };

            this.telemetryService.sendEvent(TelemetryEvents.ERROR, properties, measurements);
        }
    }
}
