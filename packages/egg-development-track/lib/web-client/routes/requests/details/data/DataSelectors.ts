import keyBy from 'lodash/keyBy';
import groupBy from 'lodash/groupBy';
import uniq from 'lodash/uniq';
import flatten from 'lodash/flatten';
import includes from 'lodash/includes';
import mapValues from 'lodash/mapValues';
import values from 'lodash/values';
import sortBy from 'lodash/sortBy';
import { createSelector } from 'reselect';

import { IMessage } from 'modules/messages/schemas/IMessage';
import { IStoreState } from 'client/IStoreState';
import { IContext } from 'routes/requests/RequestsInterfaces';
import { CommandAfterExecuteType, ICommandAfterExecutePayload } from 'modules/messages/schemas/ICommandAfterExecutePayload';
import { CommandBeforeExecuteType, ICommandBeforeExecutePayload } from 'modules/messages/schemas/ICommandBeforeExecutePayload';
import { DataMongoDbDeleteType, IDataMongoDbDeletePayload } from 'modules/messages/schemas/IDataMongoDbDeletePayload';
import { DataMongoDbInsertType, IDataMongoDbInsertPayload } from 'modules/messages/schemas/IDataMongoDbInsertPayload';
import {
    DataMongoDbReadStartType, IDataMongoDbReadStartPayload,
    DataMongoDbReadEndType, IDataMongoDbReadEndPayload
} from 'modules/messages/schemas/IDataMongoDbReadPayload';
import { DataMongoDbUpdateType, IDataMongoDbUpdatePayload } from 'modules/messages/schemas/IDataMongoDbUpdatePayload';
import { getServerOffsetFactor } from '../request/RequestSelectors';
import { getSelectedContextId, getMessageByType } from 'routes/requests/RequestsSelector';
import { getSelectedContext } from '../RequestsDetailsSelector';

/* tslint:disable-next-line:variable-name */
const Databases = {
    sql: {
        name: 'SQL',
        messageTypes: [
            CommandBeforeExecuteType,
            CommandAfterExecuteType
        ]
    },
    mongoDb: {
        name: 'MongoDB',
        messageTypes: [
            DataMongoDbInsertType,
            DataMongoDbReadStartType,
            DataMongoDbReadEndType,
            DataMongoDbUpdateType,
            DataMongoDbDeleteType
        ]
    }
};

interface ICorrelatedSqlCommandMessages {
    beforeMessage: IMessage<ICommandBeforeExecutePayload>;
    afterMessage: IMessage<ICommandAfterExecutePayload>;
}

export interface IRequestDetailDataOperationState {
    ordinal: number;
    command: string;
    database: string;
    duration: number;
    id: string;
    operation: string;
    recordCount: number | string;
    databaseName: string;
    serverName: string;
    offset: number;
}

interface ICorrelatedMongoDBReadMessages {
    startMessage: IMessage<IDataMongoDbReadStartPayload>;
    endMessage: IMessage<IDataMongoDbReadEndPayload>;
}

function correlateSqlCommands(beforeMessages: IMessage<ICommandBeforeExecutePayload>[], afterMessages: IMessage<ICommandAfterExecutePayload>[]): ICorrelatedSqlCommandMessages[] {
    // NOTE: This is a particularly naive implementation. If no after-message actually exists for a given
    //       before-message but another later after-message does exist, that will be paired to the before-message
    //       instead.

    const sortedAfterMessages = afterMessages.sort((a, b) => a.ordinal - b.ordinal);

    return beforeMessages.map(beforeMessage => {
        const afterMessage = sortedAfterMessages.find(message => message.ordinal > beforeMessage.ordinal);

        return {
            beforeMessage: beforeMessage,
            afterMessage: afterMessage
        };
    });
}

function getOperationForSqlCommand(commandMethod: string): string {
    switch (commandMethod) {
        case 'ExecuteReader':
            return 'Read';
        default:
            return commandMethod;
    }
}

function createSqlOperation(beforeAfterMessage: ICorrelatedSqlCommandMessages, offsetFactor: number): IRequestDetailDataOperationState {
    return {
        ordinal: beforeAfterMessage.beforeMessage.ordinal,
        id: beforeAfterMessage.beforeMessage.id,
        database: Databases.sql.name,
        databaseName: undefined, // NOTE: SQL does not track database name.
        serverName: undefined, // NOTE: SQL does not track server name.
        command: beforeAfterMessage.beforeMessage.payload.commandText,
        duration: beforeAfterMessage.afterMessage ? beforeAfterMessage.afterMessage.payload.duration : undefined,
        operation: getOperationForSqlCommand(beforeAfterMessage.beforeMessage.payload.commandMethod),
        recordCount: undefined, // NOTE: SQL does not track record counts.
        offset: offsetFactor + beforeAfterMessage.beforeMessage.offset
    };
}

function prettyPrintJson(value): string {
    return JSON.stringify(value, undefined, 4);
}

function createMongoDbInsertOperation(message: IMessage<IDataMongoDbInsertPayload>, offsetFactor: number): IRequestDetailDataOperationState {
    return {
        ordinal: message.ordinal,
        id: message.id,
        database: Databases.mongoDb.name,
        databaseName: message.payload.database,
        serverName: message.payload.connectionHost,
        command: prettyPrintJson(message.payload.options),
        duration: message.payload.duration,
        operation: 'Insert',
        recordCount: message.payload.count,
        offset: offsetFactor + message.offset
    };
}

function createMongoDbReadOperation(messages: ICorrelatedMongoDBReadMessages, offsetFactor: number): IRequestDetailDataOperationState {
    const recordCount = messages.endMessage ? messages.endMessage.payload.totalRecordsRead : '-';

    return {
        ordinal: messages.startMessage.ordinal,
        id: messages.startMessage.id,
        database: Databases.mongoDb.name,
        databaseName: messages.startMessage.payload.database,
        serverName: messages.startMessage.payload.connectionHost,
        command: prettyPrintJson(messages.startMessage.payload.options),
        duration: messages.startMessage.payload.duration,
        operation: 'Read',
        recordCount,
        offset: offsetFactor + messages.startMessage.offset
    };
}

function createMongoDbUpdateOperation(message: IMessage<IDataMongoDbUpdatePayload>, offsetFactor: number): IRequestDetailDataOperationState {
    return {
        ordinal: message.ordinal,
        id: message.id,
        database: Databases.mongoDb.name,
        databaseName: message.payload.database,
        serverName: message.payload.connectionHost,
        command: prettyPrintJson(message.payload.options),
        duration: message.payload.duration,
        operation: 'Update',
        recordCount: message.payload.modifiedCount + message.payload.upsertedCount,
        offset: offsetFactor + message.offset
    };
}

function createMongoDbDeleteOperation(message: IMessage<IDataMongoDbDeletePayload>, offsetFactor: number): IRequestDetailDataOperationState {
    return {
        ordinal: message.ordinal,
        id: message.id,
        database: 'MongoDB',
        databaseName: message.payload.database,
        serverName: message.payload.connectionHost,
        command: prettyPrintJson(message.payload.options),
        duration: message.payload.duration,
        operation: 'Delete',
        recordCount: message.payload.count,
        offset: offsetFactor + message.offset
    };
}

function correlateMongoDbReadMessages(startMessages: IMessage<IDataMongoDbReadStartPayload>[], endMessages: IMessage<IDataMongoDbReadEndPayload>[]): ICorrelatedMongoDBReadMessages[] {
    const endMessagesByCorrelationId = keyBy(endMessages, endMessage => endMessage.payload.correlationId);
    const sortedStartMessages = startMessages.sort((a, b) => a.ordinal - b.ordinal);
    const rtrn: ICorrelatedMongoDBReadMessages[] = [];

    for (let i = 0; i < sortedStartMessages.length; i++) {
        rtrn.push({
            startMessage: sortedStartMessages[i],
            endMessage: endMessagesByCorrelationId[sortedStartMessages[i].payload.correlationId]
        });
    }

    return rtrn;
}

function getMongoDbReadOperations(request: IContext, offsetFactor: number): IRequestDetailDataOperationState[] {
    const startMessages = getMessageByType<IDataMongoDbReadStartPayload>(request.byType, DataMongoDbReadStartType);
    const endMessages = getMessageByType<IDataMongoDbReadEndPayload>(request.byType, DataMongoDbReadEndType);
    const correlatedMessages = correlateMongoDbReadMessages(startMessages, endMessages);
    return correlatedMessages.map((msg) => {
        return createMongoDbReadOperation(msg, offsetFactor);
    });
}

function getSqlOperations(request: IContext, offsetFactor: number): IRequestDetailDataOperationState[] {
    return correlateSqlCommands(
            getMessageByType<ICommandBeforeExecutePayload>(request.byType, CommandBeforeExecuteType),
            getMessageByType<ICommandAfterExecutePayload>(request.byType, CommandAfterExecuteType))
        .map((correlation) => createSqlOperation(correlation, offsetFactor));
}

function getDataOperations<T>(request: IContext, offsetFactor: number, messageType: string, selector: (message: IMessage<T>, offsetFactor: number) => IRequestDetailDataOperationState): IRequestDetailDataOperationState[] {
    const messages = getMessageByType<T>(request.byType, messageType);
    return messages.map(message => {
        return selector(message, offsetFactor);
    });
}

export const getOperations = createSelector(
    getSelectedContext,
    getServerOffsetFactor,
    (selectedContext: IContext, offsetFactor: number): IRequestDetailDataOperationState[] => {
    if (selectedContext) {
        return []
            .concat(getSqlOperations(selectedContext, offsetFactor))
            .concat(getDataOperations(selectedContext, offsetFactor, DataMongoDbInsertType, createMongoDbInsertOperation))
            .concat(getMongoDbReadOperations(selectedContext, offsetFactor))
            .concat(getDataOperations(selectedContext, offsetFactor, DataMongoDbUpdateType, createMongoDbUpdateOperation))
            .concat(getDataOperations(selectedContext, offsetFactor, DataMongoDbDeleteType, createMongoDbDeleteOperation))
            .sort((a, b) => a.ordinal - b.ordinal);
    }

    return [];
});

function hasMessagesOfType(types, messageType: string) {
    if (types) {
        return includes(types, messageType);
    }

    return false;
}

function hasMessagesOfTypes(types, messageTypes: string[]) {
    return messageTypes.some(messageType => hasMessagesOfType(types, messageType));
}

const getListings = (state: IStoreState) => state.session.messages.listing;

// NOTE: This shouldn't be scanning all types in the system... this is pretty bad for perf,
//       need to udate this to only look at messages within the selected context.
const getDatabaseTypes = createSelector(
    getListings,
    listings => {
        const types = uniq(flatten(listings.map(listing => listing.types)));

        return values<{ name: string, messageTypes: string[] }>(Databases).filter(databaseType => hasMessagesOfTypes(types, databaseType.messageTypes)).map(dataBaseType => dataBaseType.name);
    });

export const getFilterState = createSelector(
    (state: IStoreState) => state.persisted.global.requests.details.data.filters,
    getDatabaseTypes,
    (filterState, databaseTypes) => {
        const filters = {...filterState};

        databaseTypes.forEach(type => {
            if (filters[type] === undefined) {
                filters[type] = true;
            }
        });

        return filters;
    });

const getSelectedOperations = (state: IStoreState) => state.persisted.global.requests.details.data.selectedOperations;

export const getTotalOperationCount =
    (operations: IRequestDetailDataOperationState[]): number => {
        return operations.length;
    };

export const getTotalOperationCountSelector = createSelector(
    getOperations,
    getTotalOperationCount);

interface IFilteredOperation {
    ordinal: number;
    operation: IRequestDetailDataOperationState;
}

export const getFilteredOperations =
    (filterState, operations) => {
        const filteredOperations: IFilteredOperation[] = [];

        operations.forEach((operation, index) => {
            if (filterState[operation.database]) {
                filteredOperations.push({
                    ordinal: index + 1,
                    operation: operation
                });
            }
        });

        return filteredOperations;
    };

export const getFilteredOperationsSelector = createSelector(
    getFilterState,
    getOperations,
    getFilteredOperations);

export const getSelectedOperationId =
    (selectedContextId: string, selectedOperations: { [key: string]: string }) => {
        const selectedOperationId = selectedOperations[selectedContextId];

        return selectedOperationId;
    };

export const getSelectedOperationIdSelector = createSelector(
    getSelectedContextId,
    getSelectedOperations,
    getSelectedOperationId);

export const getSelectedOperation =
    (operations: IFilteredOperation[], selectedOperationId: string) => {
        // TODO: Can this (need this) be optimized by building a map of id --> operation?
        return operations.find(operation => operation.operation.id === selectedOperationId);
    };

export const getSelectedOperationSelector = createSelector(
    getFilteredOperationsSelector,
    getSelectedOperationIdSelector,
    getSelectedOperation);

export const getFilters =
    (filterState: { [key: string]: boolean }, operations: IRequestDetailDataOperationState[]) => {
        const databases = groupBy(operations, operation => operation.database);

        return sortBy(values(mapValues(filterState, (filter, database) => {
            const databaseOperations = databases[database];

            return {
                name: database,
                isShown: filter,
                count: databaseOperations ? databaseOperations.length : 0
            };
        })), filter => filter.name);
    };

export const getFiltersSelector = createSelector(
    getFilterState,
    getOperations,
    getFilters);



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/data/DataSelectors.ts