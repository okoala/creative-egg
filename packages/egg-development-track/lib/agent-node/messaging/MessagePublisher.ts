'use strict';

import { ITransmittableMessage } from './IMessage';
import { IMessagePublisher } from './IMessagePublisher';
import { IResourceProvider } from '../configuration/IResourceProvider';
import { MessagePublisherHttp } from './MessagePublisherHttp';
import { MessagePublisherInProc } from './MessagePublisherInProc';

export interface IMessagePublisherOptions {
    server?;
};

export class MessagePublisher implements IMessagePublisher {
    private publisher: IMessagePublisher;

    public constructor(private resourceProvider: IResourceProvider) {
    }

    public init(options?: IMessagePublisherOptions) {
        if (options && options.server) {
            this.publisher = new MessagePublisherInProc(options.server);
        }
        else {
            this.publisher = new MessagePublisherHttp(this.resourceProvider);
        }
    }

    public publishMessages(messages: ITransmittableMessage[]): void {
        this.publisher.publishMessages(messages);
    }
}
