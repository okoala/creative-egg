import { IGlimpseError } from './IGlimpseError';

export interface IErrorReportingService {
    reportError(error: IGlimpseError, ...params): void;
}
