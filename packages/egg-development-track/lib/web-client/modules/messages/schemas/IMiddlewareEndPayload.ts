/* tslint:disable-next-line:variable-name */
export const MiddlewareEndType = 'middleware-end';

/* tslint:disable-next-line:variable-name */
export const ResponseHeaderOperationType = 'responseHeader';

/* tslint:disable-next-line:variable-name */
export const ResponseStatusCodeOperationType = 'responseStatusCode';

/* tslint:disable-next-line:variable-name */
export const ResponseBodyOperationType = 'responseBody';

export interface IMiddlewareOperation {
    type: string;
}

export interface IResponseBodyOperation extends IMiddlewareOperation {
    // NOTE: This operation currently has no properties.
}

// NOTE: This is not currently spec'd, but we're plumbing it in for the future.
export interface IResponseHeaderOperation extends IMiddlewareOperation {
    name: string;
    op: 'set' | 'unset';
    values?: string[];
}

export interface IResponseStatusCodeOperation extends IMiddlewareOperation {
    statusCode: number;
}

export interface IMiddlewareEndPayload {
    correlationId: string;
    name: string;
    displayName: string;
    packageName: string;
    endTime: string;
    duration: number;
    headers?: { op: string, name: string, values: string[] }[];
    operations?: IMiddlewareOperation[];
    result: string;
}



// WEBPACK FOOTER //
// ./src/client/modules/messages/schemas/IMiddlewareEndPayload.ts