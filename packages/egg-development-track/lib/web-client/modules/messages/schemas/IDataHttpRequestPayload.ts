import IMultipartSummary from './IMultipartSummary';

/* tslint:disable-next-line:variable-name */
export const DataHttpRequestType = 'data-http-request';

import { ICallStackPayload } from 'modules/messages/schemas/ICallStackPayload';

export interface IDataHttpRequestPayload extends ICallStackPayload {
    protocol: {
        identifier: string;
        version?: string;
    };
    url: string;
    method: string;
    headers: { [key: string]: string };
    body: {
        size: number;
        form: { [key: string]: string };
        content: string;
        encoding: string;
        isTruncated: boolean;
        parts?: IMultipartSummary[];
    };
    timing: {
        startTime: number;
    };
    correlationId: string;
}



// WEBPACK FOOTER //
// ./src/client/modules/messages/schemas/IDataHttpRequestPayload.ts