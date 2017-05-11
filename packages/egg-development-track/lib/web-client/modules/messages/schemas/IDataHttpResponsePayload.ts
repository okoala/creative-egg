/* tslint:disable-next-line:variable-name */
export const DataHttpResponseType = 'data-http-response';

export interface IDataHttpResponsePayload {
    url: string;
    statusCode: number;
    statusMessage?: string;
    headers: { [key: string]: string };
    body: {
        size: number;
        content: string;
        encoding: string;
        isTruncated: boolean;
    };
    endTime: string;
    duration: number;
    timing: {
        startTime: number;
        responseStart: number;
        responseEnd: number;
    };
    correlationId: string;
}



// WEBPACK FOOTER //
// ./src/client/modules/messages/schemas/IDataHttpResponsePayload.ts