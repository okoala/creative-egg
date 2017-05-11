/* tslint:disable:variable-name */
export const DataMongoDbReadStartType = 'data-mongodb-read-start';
export const DataMongoDbReadEndType = 'data-mongodb-read-end';
/* tslint:enable:variable-name */

export interface IDataMongoDbReadStartPayload {
    correlationId: string;
    operation: string;
    query;
    startTime: string;
    duration: number;
    options?;
    connectionPort: number;
    connectionHost: string;
    database: string;
    collection: string;
}

export interface IDataMongoDbReadEndPayload {
    correlationId: string;
    startTime: string;
    duration: number;
    totalReadTimeDuration: number;
    totalRecordsRead: number;
}



// WEBPACK FOOTER //
// ./src/client/modules/messages/schemas/IDataMongoDbReadPayload.ts