import IMultipartSummary from './IMultipartSummary';

/* tslint:disable-next-line:variable-name */
export const WebRequestType = 'web-request';

export interface IWebRequestPayload {
    protocol: {
        identifier: string;
        version: string;
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
    startTime: string;
    isAjax: boolean;
    clientIp: string;
    timing: {
        requestStart: number;
        requestEnd: number;
    };
};



// WEBPACK FOOTER //
// ./src/client/modules/messages/schemas/IWebRequestPayload.ts