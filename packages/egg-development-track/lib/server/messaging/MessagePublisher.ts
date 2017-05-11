'use strict';

import { IMessage } from './IMessage';
import { IMessagePublisher, IMessageStreamCallback, IMessageStreamSubscription } from './IMessagePublisher';
import { IMessageStorage } from '../storage/IMessageStorage';

import _ = require('lodash');

export class MessagePublisher implements IMessagePublisher {
    private _messageStorage: IMessageStorage;
    private _subscriptions: IMessageStreamSubscription[] = [ ];

    public constructor(messageStorage: IMessageStorage) {
        this._messageStorage = messageStorage;
    }

    public publishMessages(messages: IMessage[]) {
        messages.forEach(message => this.publishMessage(message));
    }

    public streamMessages(contextId?: string, types?: string[], callback?: IMessageStreamCallback): IMessageStreamSubscription {
        let entry: IMessageStreamSubscription;

        entry = {
            contextId: contextId,
            types: types,
            callback: callback,
            done: () => {
                const index = this._subscriptions.indexOf(entry);

                if (index >= 0) {
                    this._subscriptions.splice(index, 1);
                }
            }
        };

        this._subscriptions.push(entry);

        return entry;
    }

    private publishMessage(message: IMessage) {
        this._messageStorage.persist(message);

        // NOTE: We copy the array in case subscriptions are removed during the callback.

        const subscriptions = this._subscriptions.slice();

        subscriptions.forEach(
            subscription => {

                if (subscription.types && subscription.types.length > 0 && _.intersection(subscription.types, message.types).length === 0) {
                    return;
                }

                if (subscription.contextId && message.context.id !== subscription.contextId) {
                    return;
                }

                subscription.callback(undefined, message);
            });
    }
}
