import { ICorrelationBeginPayload } from './ICorrelationBeginPayload';
import { ILogWritePayload } from './ILogWritePayload';

/* tslint:disable-next-line:variable-name */
export const LogTimeSpanBeginType = 'log-timespan-begin';

export interface ILogTimeSpanBeginPayload extends ILogWritePayload, ICorrelationBeginPayload {
}



// WEBPACK FOOTER //
// ./src/client/modules/messages/schemas/ILogTimeSpanBeginPayload.ts