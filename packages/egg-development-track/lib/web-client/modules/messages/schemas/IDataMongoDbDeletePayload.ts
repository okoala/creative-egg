/* tslint:disable-next-line:variable-name */
export const DataMongoDbDeleteType = 'data-mongodb-delete';

export interface IDataMongoDbDeletePayload {
    operation: string;
    query: string;
    count: number;
    startTime: string;
    duration: number;
    options?;
    connectionPort: number;
    connectionHost: string;
    database: string;
    collection: string;
}



// WEBPACK FOOTER //
// ./src/client/modules/messages/schemas/IDataMongoDbDeletePayload.ts