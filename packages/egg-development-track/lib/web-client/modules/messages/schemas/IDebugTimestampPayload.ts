/* tslint:disable-next-line:variable-name */
export const DebugTimestampType = 'debug-timestamp';

import { ICallStackFrame } from './ICallStackPayload';

export interface IDebugTimestampPayload {
    name: string;
    frames?: ICallStackFrame[];
}



// WEBPACK FOOTER //
// ./src/client/modules/messages/schemas/IDebugTimestampPayload.ts