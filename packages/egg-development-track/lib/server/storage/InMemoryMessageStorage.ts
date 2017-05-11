'use strict';

import { InMemoryMessageStorageContext } from './InMemoryMessageStorageContext';
import { InMemoryRequestStorageContext } from './InMemoryRequestStorageContext';
import { IMessage } from '../messaging/IMessage';
import { MessageStorageContextType } from './IMessageStorageContext';
import { IMessageStorage } from './IMessageStorage';

import lru = require('lru-cache');

export class InMemoryMessageStorage implements IMessageStorage {
    private static MAX_CONTEXTS = 500;
    private static REQUEST_CONTEXT_TYPE = 'request';

    private cache: lru.Cache<InMemoryMessageStorageContext>;

    constructor(maxContexts?: number) {
        this.cache = lru<InMemoryMessageStorageContext>({
            max: maxContexts || InMemoryMessageStorage.MAX_CONTEXTS,
            dispose: key => delete this.contexts[key]
        });
    }

    public contexts: { [key: string]: InMemoryMessageStorageContext } = { };

    public persist(message: IMessage): void {
        const contextId = message.context.id;

        let context = this.cache.get(contextId);

        if (!context) {
            if (message.context.type.toLowerCase() === InMemoryMessageStorage.REQUEST_CONTEXT_TYPE) {
                context = new InMemoryRequestStorageContext();
            }
            else {
                context = new InMemoryMessageStorageContext(MessageStorageContextType.Generic);
            }

            this.cache.set(contextId, context);
            this.contexts[contextId] = context;
        }

        context.persist(message);
    }
}
