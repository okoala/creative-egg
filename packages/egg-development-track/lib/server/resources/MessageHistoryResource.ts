'use strict';

import { IMessageQuery } from '../storage/IMessageQuery';
import { IResource } from './IResource';
import { IServer } from '../IServer';
import { MessageUtilities } from '../messaging/MessageUtilities';

export class Resource implements IResource {
    private messageQuery: IMessageQuery;

    public constructor(server?: IServer) {
        if (server) {
            this.init(server.providers.messageQuery);
        }
    }

    public init(messageQuery: IMessageQuery) {
        this.messageQuery = messageQuery;
    }

    public name = 'message-history';
    public uriTemplate = '?types={types}';
    public type = 'client';
    public invoke(req, res) {
        const types = req.query.types ? req.query.types.split(',') : [ ];
        const messages = this.messageQuery.queryMessages(undefined, types);
        const payloads = MessageUtilities.toPayloadJson(messages);

        res.status(200);
        res.type('application/json');
        res.send(payloads);
    };
}
