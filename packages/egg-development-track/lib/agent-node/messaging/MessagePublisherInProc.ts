'use strict';

import { IMessagePublisher } from './IMessagePublisher';

export class MessagePublisherInProc implements IMessagePublisher {
    public constructor(private server) {
    }

    public publishMessages(messages) {
        this.server.providers.messagePublisher.publishMessages(messages);

        for (let i = 0; i < messages.length; i++) {
            messages[i].sent = true;
        }
    };
}
