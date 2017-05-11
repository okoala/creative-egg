import { ICorrelationPayload } from './ICorrelationPayload';

/* tslint:disable-next-line:variable-name */
export const CorrelationEndType = 'correlation-end';

export interface ICorrelationEndPayload extends ICorrelationPayload {
    duration: number;
}



// WEBPACK FOOTER //
// ./src/client/modules/messages/schemas/ICorrelationEndPayload.ts