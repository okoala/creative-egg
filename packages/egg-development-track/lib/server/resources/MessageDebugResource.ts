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

    public name = 'message-debug';
    public uriTemplate = '{?types,contextIds}';
    public type = 'client';
    public invoke(req, res) {
        const types = req.query.types ? req.query.types.split(',') : [];
        const contextIds = req.query.contextIds ? req.query.contextIds.split(',') : undefined;

        let messages = [];
        if (contextIds) {
            for (let i = 0; i < contextIds.length; i++) {
                messages = messages.concat(this.messageQuery.queryMessages(contextIds[i], types));
            }
        }
        else {
            messages = this.messageQuery.queryMessages(undefined, types);
        }
        const payloads = MessageUtilities.toPayloadJson(messages);

        res.status(200);
        res.type('application/json');
        res.send(payloads);
    };
}
