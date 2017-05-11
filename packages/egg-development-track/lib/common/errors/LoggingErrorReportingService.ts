'use strict';

import { IErrorReportingService } from './IErrorReportingService';
import { IGlimpseError, GlimpseErrorSeverity } from './IGlimpseError';
import { getSlugForErrorCode } from './ErrorCodes';

export class LoggingErrorReportingService implements IErrorReportingService {
    public reportError(error: IGlimpseError, ...params): void {
        console.error(`Glimpse (${GlimpseErrorSeverity[error.severity]} ${getSlugForErrorCode(error.errorCode)}): ${error.message}`, ...params);
    }
}
