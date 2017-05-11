import { ICorrelationEndPayload } from './ICorrelationEndPayload';
import { ILogWritePayload } from './ILogWritePayload';

/* tslint:disable-next-line:variable-name */
export const LogTimeSpanEndType = 'log-timespan-end';

export interface ILogTimeSpanEndPayload extends ILogWritePayload, ICorrelationEndPayload {
}



// WEBPACK FOOTER //
// ./src/client/modules/messages/schemas/ILogTimeSpanEndPayload.ts