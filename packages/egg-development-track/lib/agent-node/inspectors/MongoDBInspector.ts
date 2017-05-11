'use strict';

import { IAgent } from '../IAgent';
import { IContextManager } from '../messaging/IContextManager';
import { DateTimeValue } from '../configuration/DateTimeValue';
import moment = require('moment');
import { default as tracing, IEventCallback} from '../tracing/Tracing';
import { IInstrumentationEvent } from '../tracing/IInstrumentationEvent';
import _ = require('lodash');
import { GuidHelper } from '../util/GuidHelper';
import {
    EVENT_MONGODB_COLLECTION_INSERT,
    EVENT_MONGODB_READ_START,
    EVENT_MONGODB_READ_RECORD,
    EVENT_MONGODB_READ_END,
    EVENT_MONGODB_COLLECTION_COUNT,
    EVENT_MONGODB_COLLECTION_INSERT_METHODS,
    EVENT_MONGODB_COLLECTION_UPDATE_METHODS,
    EVENT_MONGODB_COLLECTION_DELETE_METHODS
} from '../tracing/module_instrumentors/MongoDBEvents';

/* tslint:disable:no-any */

interface IConnectionInfo {
    host: string;
    port: number;
    database: string;
    collectionName: string;
}

/**
 * Class that represents a set of data that we pass along as part of the "options"
 * parameter to various MongoDB calls. This lets us pass data between multiple proxy calls on the
 * same call stack or call chain.
 */
export class GlimpseMongoDBOptions {

    private static CUSTOM_KEY = '__glimpse_customOptions';

    private _operationName;
    private _correlationId: string;
    private _readStartTime: DateTimeValue;
    private _recordsRead: number = 0;
    private messagesSent: { [key: string]: boolean } = {};

    /**
     * Set the primary operation name for this call chain.  This is what is shown in the custom message.
     */
    public set operationName(name: string) {
        this._operationName = name;
    }

    /**
     * Get the operation name
     */
    public get operationName(): string {
        return this._operationName;
    }

    /**
     * set correlation ID for messages on this cursor
     */
    public set correlationId(guid: string) {
        this._correlationId = guid;
    }

    /**
     * Get correlation ID for messages on this cursor
     */
    public get correlationId(): string {
        return this._correlationId;
    }

    /**
     * set if a message is sent for the given message type
     */
    public getMessageSent(messageType: string): boolean {
        return this.messagesSent[messageType];
    }

    /**
     * get if a message is sent for the given message type
     */
    public setMessageSent(messageType: string, sent: boolean) {
        this.messagesSent[messageType] = sent;
    }

    public get recordsRead(): number {
        return this._recordsRead;
    }

    public set recordsRead(recordsRead: number) {
        this._recordsRead = recordsRead;
    }

    public incremenetRecordsRead() {
        ++this._recordsRead;
    }

    public get readStartTime(): DateTimeValue {
        return this._readStartTime;
    }

    public set readStartTime(readStartTime: DateTimeValue) {
        this._readStartTime = readStartTime;
    }

    /**
     * Return the GlimpseMongoDBOptions instance from the given object, or return undefined if not available.
     */
    public static get(options: Object): GlimpseMongoDBOptions {
        let gopts: GlimpseMongoDBOptions;
        if (options) {
            gopts = options[GlimpseMongoDBOptions.CUSTOM_KEY];
        }
        return gopts;
    }

    /**
     * Remove the GlimpseMongoDBOptions instance from the given object
     */
    public static clear(options: Object) {
        if (options && options[GlimpseMongoDBOptions.CUSTOM_KEY]) {
            delete options[GlimpseMongoDBOptions.CUSTOM_KEY];
        }
    }

    /**
     *  Ensure the GlimpseMongoDBOptions instance exists on the given object, and return it.
     */
    public static ensure(options: Object): GlimpseMongoDBOptions {
        let gopts: GlimpseMongoDBOptions = options[GlimpseMongoDBOptions.CUSTOM_KEY];
        if (!gopts) {
            gopts = new GlimpseMongoDBOptions();
            options[GlimpseMongoDBOptions.CUSTOM_KEY] = gopts;
        }
        return gopts;
    }
}

export class MongoDBInspector {
    private agent: IAgent;
    private contextManager: IContextManager;
    private listeners: { [eventName: string]: IEventCallback } = {};

    public init(agent: IAgent): any {
        this.agent = agent;
        this.contextManager = agent.providers.contextManager;

        this.listeners = {
            [EVENT_MONGODB_COLLECTION_INSERT]: (event) => {
                this.insertInspector(event);
            },

            [EVENT_MONGODB_COLLECTION_INSERT_METHODS]: (event) => {
                this.insertMethodsInspector(event);
            },

            [EVENT_MONGODB_COLLECTION_UPDATE_METHODS]: (event) => {
                this.updateMethodsInspector(event);
            },

            [EVENT_MONGODB_COLLECTION_COUNT]: (event) => {
                this.countInspector(event);
            },

            [EVENT_MONGODB_COLLECTION_DELETE_METHODS]: (event) => {
                this.deleteMethodsInspector(event);
            },

            [EVENT_MONGODB_READ_START]: (event) => {
                this.readStartInspector(event);
            },

            [EVENT_MONGODB_READ_RECORD]: (event) => {
                this.readRecordInspector(event);
            },

            [EVENT_MONGODB_READ_END]: (event) => {
                this.readEndInspector(event);
            }
        };

        for (const event in this.listeners) {
            if (!this.listeners.hasOwnProperty(event)) {
                continue;
            }
            tracing.onAlways(event, this.listeners[event]);
        }
    }

    public removeEventListeners() {
        for (const event in this.listeners) {
            if (!this.listeners.hasOwnProperty(event)) {
                continue;
            }
            tracing.removeEventListener(event, this.listeners[event]);
        }
    }

    /**
     *  send message indicating first read of a record from mongo
     */
    private sendReadStartMessage(
        err: string,
        correlationId: string,
        operation: string,
        startTime: DateTimeValue,
        query: Object,
        options: Object,
        ci: IConnectionInfo): any {
        const context = this.contextManager.currentContext();
        if (context) {
            const endTime = this.agent.providers.dateTime.now;
            this.agent.broker.createAndSendMessage(
                {
                    correlationId: correlationId,
                    operation: operation,
                    query: query,
                    startTime: startTime.format(),
                    duration: endTime.diff(startTime),
                    options: options,
                    connectionHost: ci.host,
                    connectionPort: ci.port,
                    database: ci.database,
                    collection: ci.collectionName
                },
                ['data-mongodb-read-start'], undefined /*indices*/, context);
        }
    };

    /**
     * send message indicating mongodb cursor was closed and a read effectively ended.
     * 
     * closeStartTime is the point in time when the close method was called.
     */
    private sendReadEndMessage(
        err: string,
        correlationId: string,
        closeStartTime: DateTimeValue,
        readStartTime: DateTimeValue,
        totalRecordsRead: number): any {

        const context = this.contextManager.currentContext();
        if (context) {
            const endTime = this.agent.providers.dateTime.now;
            this.agent.broker.createAndSendMessage(
                {
                    correlationId: correlationId,
                    startTime: closeStartTime.format(),
                    duration: endTime.diff(closeStartTime),
                    totalReadTimeDuration: endTime.diff(readStartTime),
                    totalRecordsRead: totalRecordsRead
                },
                ['data-mongodb-read-end'], undefined /*indices*/, context);
        }
    };

    /**
     *  sendAfterInsertMessage
     */
    private sendAfterInsertMessage(
        err: string,
        operation: string,
        startTime: DateTimeValue,
        docs: Object[],
        numInserted: number,
        insertedIDs: number[],
        options: Object,
        ci: IConnectionInfo): any {
        const context = this.contextManager.currentContext();
        if (context) {
            const endTime = this.agent.providers.dateTime.now;
            this.agent.broker.createAndSendMessage(
                {
                    operation: operation,
                    docs: docs,
                    count: numInserted,
                    insertedIds: insertedIDs,
                    startTime: startTime.format(),
                    duration: endTime.diff(startTime),
                    options: options,
                    connectionHost: ci.host,
                    connectionPort: ci.port,
                    database: ci.database,
                    collection: ci.collectionName
                },
                ['data-mongodb-insert'], undefined /*indices*/, context);
        }
    };

    /**
     * method to send an update completed message
     */
    private sendAfterUpdateMessage(
        err: string,
        operation: string,
        startTime: DateTimeValue,
        query: Object,
        updates: Object,
        matchedCount: number,
        modifiedCount: number,
        upsertedCount: number,
        options: Object,
        ci: IConnectionInfo): any {
        const context = this.contextManager.currentContext();
        if (context) {
            const endTime = this.agent.providers.dateTime.now;
            this.agent.broker.createAndSendMessage(
                {
                    operation: operation,
                    query: query,
                    updates: updates,
                    matchedCount: matchedCount,
                    modifiedCount: modifiedCount,
                    upsertedCount: upsertedCount,
                    startTime: startTime.format(),
                    duration: endTime.diff(startTime),
                    options: options,
                    connectionHost: ci.host,
                    connectionPort: ci.port,
                    database: ci.database,
                    collection: ci.collectionName
                },
                ['data-mongodb-update'], undefined /*indices*/, context);
        }
    };

    /**
     * method to send a delete completed message.
     */
    private sendAfterDeleteMessage(
        err: string,
        operation: string,
        startTime: DateTimeValue,
        query: Object,
        numDeleted: number,
        options: Object,
        ci: IConnectionInfo): any {
        const context = this.contextManager.currentContext();
        if (context) {
            const endTime = this.agent.providers.dateTime.now;
            this.agent.broker.createAndSendMessage(
                {
                    operation: operation,
                    query: query,
                    count: numDeleted,
                    startTime: startTime.format(),
                    duration: endTime.diff(startTime),
                    options: options,
                    connectionHost: ci.host,
                    connectionPort: ci.port,
                    database: ci.database,
                    collection: ci.collectionName
                },
                ['data-mongodb-delete'], undefined /*indices*/, context);
        }
    };

    /**
     * Handle insert method
     */
    private insertInspector(event: IInstrumentationEvent) {
        // since insert implementation calls back in on insertMany, we need to override the operation name used
        GlimpseMongoDBOptions.ensure(event.data.originalArgs[1]).operationName = 'insert';
    };

    /**
     * Notify insert methods including 'insertMany' and 'insertOne'
     */
    private insertMethodsInspector(event: IInstrumentationEvent) {
        const connectionInfo = MongoDBInspector.GetConnectionInfoFromCollection(event.data.originalThis);
        let docs = event.data.originalArgs[0];
        let options = event.data.originalArgs[1];
        const methodName = event.data.methodName;
        let count = 0;
        let insertedIDs = [];
        const result = event.data.result;

        if (typeof options === 'function') {
            options = undefined;
        }

        let operationName = methodName;
        const opts: GlimpseMongoDBOptions = GlimpseMongoDBOptions.get(options);
        if (opts) {
            if (opts.operationName) {
                operationName = opts.operationName;
            }

            // strip out the custom options as they're no longer necessary
            GlimpseMongoDBOptions.clear(options);
        }

        if (!options) {
            options = {};
        }
        else {
            // strip out the custom options as they're no longer necessary
            GlimpseMongoDBOptions.clear(options);
            options = _.cloneDeep(options);
            // strip out checkKeys as Mongo adds this
            options.checkKeys = undefined;
        }

        if (methodName === 'insertOne') {
            docs = [docs];
        }

        if (!event.data.err) {
            if (methodName === 'insertOne') {
                if (result) {
                    count = result.ops.length;
                    insertedIDs = [result.insertedId];
                }
            }
            else {
                if (result) {
                    count = result.insertedCount;
                    insertedIDs = result.insertedIds;
                }
            }
        }

        this.sendAfterInsertMessage(
            event.data.err,
            operationName,
            DateTimeValue.fromMomentAndHRTime(event.data.startTime, event.data.hrtime),
            docs,
            count,
            insertedIDs,
            options,
            connectionInfo
        );
    };

    /**
     * Notify delete methods including 'deleteMany', 'deleteOne', 'findOneAndDelete', 'remove'
     */
    private deleteMethodsInspector(event: IInstrumentationEvent) {
        const originalArgs = event.data.originalArgs;
        const filter = originalArgs[0];
        let options = originalArgs[1];
        const connectionInfo = MongoDBInspector.GetConnectionInfoFromCollection(event.data.originalThis);
        let count = 0;
        const result = event.data.result;
        const methodName = event.data.methodName;

        if (typeof options === 'function') {
            options = undefined;
        }

        if (!options) {
            options = {};
        }
        else {
            GlimpseMongoDBOptions.clear(options);
            options = _.cloneDeep(options);
        }

        if (result) {
            if (methodName === 'findOneAndDelete') {
                if (result.value) {
                    count = 1;
                }
            }
            else if (methodName === 'remove') {
                if (result.result) {
                    count = result.result.n;
                }
            }
            else {
                count = result.deletedCount;
            }
        }

        this.sendAfterDeleteMessage(
            event.data.err,
            methodName,
            DateTimeValue.fromMomentAndHRTime(event.data.startTime, event.data.hrtime),
            filter,
            count,
            options,
            connectionInfo
        );
    };

    /**
     * Notify update operation
     */
    private updateMethodsInspector(event: IInstrumentationEvent) {
        const connectionInfo = MongoDBInspector.GetConnectionInfoFromCollection(event.data.originalThis);
        const originalArgs = event.data.originalArgs;
        const result = event.data.result;
        const methodName = event.data.methodName;
        let filter = originalArgs[0];
        let update = originalArgs[1];
        let options = originalArgs[2];
        let matchedCount = 0;
        let modifiedCount = 0;
        let upsertedCount = 0;

        if (typeof options === 'function') {
            options = undefined;
        }

        if (!options) {
            options = {};
        }
        else {
            // strip out the custom options as they're no longer necessary
            GlimpseMongoDBOptions.clear(options);
            options = _.cloneDeep(options);
        }

        if (result) {
            matchedCount = result.matchedCount;
            modifiedCount = result.modifiedCount;
            upsertedCount = result.upsertedCount;

            if (methodName === 'findOneAndUpdate') {
                if (result.lastErrorObject.updatedExisting) {
                    upsertedCount = 0;
                    matchedCount = 1;
                    modifiedCount = 1;
                }
                else if (result.lastErrorObject.n > 0) {
                    upsertedCount = 1;
                    matchedCount = 1;
                    modifiedCount = 0;
                }
                else {
                    upsertedCount = 0;
                    matchedCount = 0;
                    modifiedCount = 0;
                }
            }
        }

        this.sendAfterUpdateMessage(
            event.data.err,
            event.data.methodName,
            DateTimeValue.fromMomentAndHRTime(event.data.startTime, event.data.hrtime),
            filter,
            update,
            matchedCount,
            modifiedCount,
            upsertedCount,
            options,
            connectionInfo
        );
    };

    /**
     *  Inspect collection read count
     */
    private countInspector(event: IInstrumentationEvent) {
        const originalThis = event.data.originalThis;
        const originalArgs = event.data.originalArgs;
        const connectionInfo = MongoDBInspector.GetConnectionInfoFromCollection(originalThis);
        const query = originalArgs[0];
        let options = event.data.originalArgs[1];
        const correlationId = GuidHelper.newGuid();
        const startTime = DateTimeValue.fromMomentAndHRTime(event.data.startTime, event.data.hrtime);

        if (typeof options === 'function') {
            options = undefined;
        }

        if (!options) {
            options = {};
        }

        this.sendReadStartMessage(
            event.data.err,
            correlationId,
            event.data.methodName,
            startTime,
            query,
            options,
            connectionInfo
        );

        // for count, assume that we always read just one record if no error.
        const recordsRead = event.data.err ? 0 : 1;

        this.sendReadEndMessage(
            event.data.err,
            correlationId,
            startTime,
            startTime,
            recordsRead);
    };

    /*
     * send the read start message to mark the begining of a set of read operations
     */
    private readStartInspector(event: IInstrumentationEvent) {
        const originalThis = event.data.originalThis;
        let cursorCustomOpts = GlimpseMongoDBOptions.ensure(originalThis.s.cmd);
        if (!cursorCustomOpts.getMessageSent('data-mongodb-read-start')) {
            cursorCustomOpts.setMessageSent('data-mongodb-read-start', true);

            const connectionInfo: IConnectionInfo = MongoDBInspector.GetConnectionInfoFromCursor(originalThis);

            cursorCustomOpts.operationName = event.data.methodName;
            cursorCustomOpts.readStartTime = DateTimeValue.fromUnixMillisecondTimestamp(event.timestamp, event.time);

            // check for existing correlation ID, as this will be present if close() is called before next()/each()/forEach()/...
            if (!cursorCustomOpts.correlationId) {
                cursorCustomOpts.correlationId = GuidHelper.newGuid();
            }

            // clone options & clear out Glimpse opts so we don't include them in Glimpse messages
            const opts = _.cloneDeep(originalThis.s.cmd);
            GlimpseMongoDBOptions.clear(opts);

            this.sendReadStartMessage(
                event.data.err,
                cursorCustomOpts.correlationId,
                cursorCustomOpts.operationName,
                cursorCustomOpts.readStartTime,
                originalThis.s.cmd.query,
                opts,
                connectionInfo
            );
        }
    }

    /**
     * respond to each record being read through a cursor.
     */
    private readRecordInspector(event: IInstrumentationEvent) {
        const originalThis = event.data.originalThis;
        let operationName = event.data.methodName;

        let cursorCustomOpts = GlimpseMongoDBOptions.ensure(originalThis.s.cmd);
        if (cursorCustomOpts.operationName) {
            operationName = cursorCustomOpts.operationName;
        }

        if (event.data.result) {
            // Kinda' hacky to count number of records read.  Ultimately this logic should be pulled out 
            // into the "tracing" part so that a set of clear logical events are emitted indicating what is happening.  
            //  - for toArray() calls we just get the length of the array.
            //  - for each(), next() will be invoked by the underlying implementation, so we don't want to double-count records. 
            //  - for forEach(), each() will be invoked by the driver.
            const isSpecial = operationName === 'toArray' || operationName === 'each' || operationName === 'forEach';
            if (operationName === 'toArray' && Array.isArray(event.data.result)) {
                cursorCustomOpts.recordsRead = event.data.result.length;
            }
            else if (operationName === 'each' && event.data.methodName === 'each') {
                cursorCustomOpts.incremenetRecordsRead();
            }
            else if (operationName === 'forEach' && event.data.methodName === 'each') {
                cursorCustomOpts.incremenetRecordsRead();
            }
            else if (!isSpecial) {
                cursorCustomOpts.incremenetRecordsRead();
            }
        }
    }

    /**
     * respond to the end of a read operation through a cursor.  Should generally respond to a cursor close.
     */
    private readEndInspector(event: IInstrumentationEvent) {
        const originalThis = event.data.originalThis;

        let cursorCustomOpts = GlimpseMongoDBOptions.ensure(originalThis.s.cmd);
        let correlationId = cursorCustomOpts.correlationId;
        let readStartTime = cursorCustomOpts.readStartTime;
        let totalRecordsRead = cursorCustomOpts.recordsRead;

        if (!correlationId) {
            // account for cases where a cursor is closed before the first record is read.
            correlationId = GuidHelper.newGuid();
            cursorCustomOpts.correlationId = correlationId;
            readStartTime = DateTimeValue.fromMomentAndHRTime(moment(), process.hrtime());
            totalRecordsRead = 0;
        }

        if (!cursorCustomOpts.getMessageSent('data-mongodb-read-end')) {
            cursorCustomOpts.setMessageSent('data-mongodb-read-end', true);

            this.sendReadEndMessage(
                event.data.err,
                correlationId,
                DateTimeValue.fromMomentAndHRTime(event.data.startTime, event.data.hrtime),
                readStartTime,
                totalRecordsRead
            );
        }
    }

    /**
     * method to extract connection info details from a MongoDB Cusror istance
     */
    private static GetConnectionInfoFromCursor(cursor): IConnectionInfo {
        // Mongo driver 2.0 and 2.1 support serverDetails but not availableConnections,
        // but Mongo driver 2.2. supports availableConnections but not serverDetails.
        let host, port;
        if (cursor.topology.s.serverDetails) {
            host = cursor.topology.s.serverDetails.host;
            port = cursor.topology.s.serverDetails.port;
        } else if (cursor.topology.s.pool.availableConnections.length) {
            host = cursor.topology.s.pool.availableConnections[0].host;
            port = cursor.topology.s.pool.availableConnections[0].port;
        }
        const dbname = cursor.options.db.s.databaseName;
        return {
            host,
            port,
            database: dbname,
            collectionName: cursor.ns.substring(dbname.length + 1)
        };
    }

    /**
     * method to extract connection info details from a MongoDB Collection istance
     */
    private static GetConnectionInfoFromCollection(collection): IConnectionInfo {
        return {
            host: collection.s.topology.s.host,
            port: collection.s.topology.s.port,
            database: collection.s.dbName,
            collectionName: collection.s.name
        };
    }
}
