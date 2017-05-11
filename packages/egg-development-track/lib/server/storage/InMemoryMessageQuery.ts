'use strict';

import { IMessage } from '../messaging/IMessage';
import { IMessageStorageContext, MessageStorageContextType } from './IMessageStorageContext';
import { IMessageQuery } from './IMessageQuery';
import { IMessageStorage } from './IMessageStorage';
import { IRequestStorageContext } from './IRequestStorageContext';
import { IRequestFilters } from './IRequestFilters';

import _ = require('lodash');
import moment = require('moment');

export class InMemoryMessageQuery implements IMessageQuery {
    private static MAX_REQUESTS_PER_PAGE: number = 50;

    private storage: IMessageStorage;

    constructor(storage: IMessageStorage) {
        this.storage = storage;
    }

    public queryMessages(contextId?: string, types?: string[]): IMessage[] {

        const typeFilter = (message: IMessage) => _.intersection(message.types, types).length > 0;

        if (contextId) {
            const context = this.storage.contexts[contextId];

            if (context) {
                return (types && types.length > 0) ? _.filter(context.messages, typeFilter) : context.messages;
            }
            else {
                return [ ];
            }
        }
        else {
            return _(this.storage.contexts)
                .values<IMessageStorageContext>()
                .map(context => types ? _.filter(context.messages, typeFilter) : context.messages)
                .flatten<IMessage>()
                .value();
        }
    }

    public queryRequests(filters?: IRequestFilters, types?: string[]): IMessage[] {
        let requests = _(this.storage.contexts)
            .values<IMessageStorageContext>()
            .filter(context => context.type === MessageStorageContextType.Request)
            .map(context => <IRequestStorageContext> context);

        if (filters) {
            if (filters.durationMaximum) {
                requests = requests.filter(request => request.indices.duration && request.indices.duration <= filters.durationMaximum);
            }

            if (filters.durationMinimum) {
                requests = requests.filter(request => request.indices.duration && request.indices.duration >= filters.durationMinimum);
            }

            if (filters.urlContains) {
                requests = requests.filter(request => request.indices.url && request.indices.url.search(filters.urlContains) >= 0);
            }

            if (filters.methodList && filters.methodList.length > 0) {
                requests = requests.filter(request => request.indices.method && filters.methodList.some(method => method === request.indices.method));
            }

            if (filters.tagList && filters.tagList.length > 0) {
                requests = requests.filter(request => request.indices.tags && _.intersection(request.indices.tags, filters.tagList).length > 0);
            }

            if (filters.statusCodeMinimum) {
                requests = requests.filter(request => request.indices.statusCode && request.indices.statusCode >= filters.statusCodeMinimum);
            }

            if (filters.statusCodeMaximum) {
                requests = requests.filter(request => request.indices.statusCode && request.indices.statusCode <= filters.statusCodeMaximum);
            }

            if (filters.requestTimeBefore) {
                requests = requests.filter(request => request.indices.dateTime && request.indices.dateTime.isBefore(filters.requestTimeBefore));
            }

            if (filters.userId) {
                requests = requests.filter(request => request.indices.userId && request.indices.userId.toLowerCase() === filters.userId.toLowerCase());
            }
        }

        let messages = requests
            .orderBy(request => (request.indices.dateTime ? request.indices.dateTime : moment(0)).valueOf(), 'desc')
            .take(InMemoryMessageQuery.MAX_REQUESTS_PER_PAGE)
            .map(request => request.messages)
            .flatten<IMessage>();

        if (types) {
            messages = messages.filter(message => _.intersection(message.types, types).length > 0);
        }

        return messages.value();
    }
}
