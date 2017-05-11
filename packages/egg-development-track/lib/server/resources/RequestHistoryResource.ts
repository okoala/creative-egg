'use strict';

import { IMessageQuery } from '../storage/IMessageQuery';
import { IResource } from './IResource';
import { IRequestFilters } from '../storage/IRequestFilters';
import { IServer } from '../IServer';
import { MessageUtilities } from '../messaging/MessageUtilities';

import * as express from 'express';
import * as moment from 'moment';

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

    public name = 'request-history';
    public uriTemplate = '{?dmin,dmax,url,methods,smin,smax,tags,before,userId,types}';
    public type = 'client';

    public invoke(req: express.Request, res: express.Response) {
        const filters: IRequestFilters = {};
        let types = undefined;

        if (req.query) {
            if (req.query.dmin) {
                filters.durationMinimum = parseInt(req.query.dmin, 10);
            }

            if (req.query.dmax) {
                filters.durationMaximum = parseInt(req.query.dmax, 10);
            }

            if (req.query.url) {
                filters.urlContains = req.query.url;
            }

            if (req.query.methods) {
                filters.methodList = req.query.methods.split(',');
            }

            if (req.query.smin) {
                filters.statusCodeMinimum = parseInt(req.query.smin, 10);
            }

            if (req.query.smax) {
                filters.statusCodeMaximum = parseInt(req.query.smax, 10);
            }

            if (req.query.tags) {
                filters.tagList = req.query.tags.split(',');
            }

            if (req.query.before) {
                filters.requestTimeBefore = moment(req.query.before);
            }

            if (req.query.userId) {
                filters.userId = req.query.userId;
            }

            if (req.query.types) {
                types = req.query.types.split(',');
            }
        }

        const messages = this.messageQuery.queryRequests(filters, types);
        const payloads = MessageUtilities.toPayloadJson(messages);

        res.status(200);
        res.type('application/json');
        res.send(payloads);
    };
}
