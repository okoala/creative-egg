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

    public name = 'context';
    public uriTemplate = '?contextId={contextId}{&types}';
    public templateName = 'contextTemplate';
    public type = 'client';
    public invoke(req, res) {
        if (!req.query.contextId) {
            res.sendStatus(404);
            res.send('missing contextId parameter');
        }
        else {
            let types = [];
            if (req.query.types) {
                types = req.query.types.split(',');
            }

            const messages = this.messageQuery.queryMessages(req.query.contextId, types);
            const payloads = MessageUtilities.toPayloadJson(messages);

            res.status(200);
            res.type('application/json');
            res.send(payloads);
        }
    };
}
