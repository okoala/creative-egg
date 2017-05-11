'use strict';

import { InMemoryMessageStorageContext } from './InMemoryMessageStorageContext';
import { IMessage } from '../messaging/IMessage';
import { MessageStorageContextType } from './IMessageStorageContext';
import { IRequestStorageContext } from './IRequestStorageContext';
import { IRequestIndices } from './IRequestIndices';

import _ = require('lodash');
import moment = require('moment');

class InMemoryRequestIndices implements IRequestIndices {
    private _duration: number;
    private _url: string;
    private _method: string;
    private _statusCode: number;
    private _dateTime: moment.Moment;
    private _userId: string;
    private _tags: string[] = [ ];

    public get duration(): number {
        return this._duration;
    }

    public get url(): string {
        return this._url;
    }

    public get method(): string {
        return this._method;
    }

    public get statusCode(): number {
        return this._statusCode;
    }

    public get dateTime(): moment.Moment {
        return this._dateTime;
    }

    public get userId(): string {
        return this._userId;
    }

    public get tags(): string[] {
        return this._tags;
    }

    public update(message: IMessage): void {
        if (message.indices) {
            const duration = message.indices['request-duration'];

            if (duration) {
                this._duration = duration;
            }

            const url = message.indices['request-url'];

            if (url) {
                this._url = url;
            }

            const method = message.indices['request-method'];

            if (method) {
                this._method = method;
            }

            const userId = message.indices['request-userId'];

            if (userId) {
                this._userId = userId;
            }

            const statusCode = message.indices['request-statuscode'];

            if (statusCode) {
                this._statusCode = statusCode;
            }

            const dateTime = message.indices['request-datetime'];

            if (dateTime) {
                this._dateTime = moment(dateTime);
            }

            const tags = message.indices['request-tags'];

            if (tags) {
                this._tags = _.union(this._tags, tags);
            }
        }
    }
}

export class InMemoryRequestStorageContext extends InMemoryMessageStorageContext implements IRequestStorageContext {
    private _indices: InMemoryRequestIndices = new InMemoryRequestIndices();

    constructor() {
        super(MessageStorageContextType.Request);
    }

    public get indices(): IRequestIndices {
        return this._indices;
    }

    public persist(message: IMessage): void {
        super.persist(message);

        this._indices.update(message);
    }
}
