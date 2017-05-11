'use strict';

/* tslint:disable: no-var-requires */

import { IMessagePublisher } from '../messaging/IMessagePublisher';
import { IResource } from './IResource';
import { IServer } from '../IServer';

export class Resource implements IResource {
    private messagePublisher: IMessagePublisher;

    public constructor(server?: IServer) {
        if (server) {
            this.init(server.providers.messagePublisher);
        }
    }

    public init(messagePublisher: IMessagePublisher) {
        this.messagePublisher = messagePublisher;
    }

    public name = 'message-ingress';
    public templateName = 'messageIngressTemplate';
    public type = 'agent';
    public invoke(req, res) {
        // TODO: need to respond with processed message IDs (see #51)
        // TODO: need to validate posting (see #51)
        this.messagePublisher.publishMessages(req.body);
        res.sendStatus(202);
    };
}
