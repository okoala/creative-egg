/* tslint:disable-next-line:variable-name */
export const WebResponseType = 'web-response';

export interface IWebResponsePayload {
    url: string;
    headers: { [key: string]: string[] };
    statusCode: number;
    statusMessage: string;
    duration: number;
    endTime: string;
    body: {
        size: number;
        content: string;
        encoding: string;
        isTruncated: boolean;
    };
    timing: {
        responseStart: number;
        responseEnd: number;
    };
}



// WEBPACK FOOTER //
// ./src/client/modules/messages/schemas/IWebResponsePayload.ts