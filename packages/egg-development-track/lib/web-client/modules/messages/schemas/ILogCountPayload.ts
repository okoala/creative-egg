import { ILogWritePayload } from './ILogWritePayload';

/* tslint:disable-next-line:variable-name */
export const LogCountType = 'log-count';

export interface ILogCountPayload extends ILogWritePayload {
    count: number;
}



// WEBPACK FOOTER //
// ./src/client/modules/messages/schemas/ILogCountPayload.ts