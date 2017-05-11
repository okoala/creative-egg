/* tslint:disable-next-line:variable-name */
export const DataMongoDbInsertType = 'data-mongodb-insert';

export interface IDataMongoDbInsertPayload {
    operation: string;
    docs: ({})[];
    count: number;
    insertedIds: number;
    startTime: string;
    duration: number;
    options?;
    connectionPort: number;
    connectionHost: string;
    database: string;
    collection: string;
}



// WEBPACK FOOTER //
// ./src/client/modules/messages/schemas/IDataMongoDbInsertPayload.ts