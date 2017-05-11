import { ICallStackPayload } from './ICallStackPayload';

/* tslint:disable-next-line:variable-name */
export const MiddlewareStartType = 'middleware-start';

export interface IMiddlewareStartPayload extends ICallStackPayload {
    correlationId: string;
    name: string;
    displayName: string;
    packageName: string;
    startTime: string;
}



// WEBPACK FOOTER //
// ./src/client/modules/messages/schemas/IMiddlewareStartPayload.ts