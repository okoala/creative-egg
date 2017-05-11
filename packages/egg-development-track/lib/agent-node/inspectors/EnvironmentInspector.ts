'use strict';

import { IncomingMessage, ServerResponse } from 'http';

import { IAgent } from '../IAgent';
import { IServerRequestInspector } from './IServerRequestInspector';
import { HttpHelper } from '../util/HttpHelper';
import { DateTimeValue } from '../configuration/DateTimeValue';

import os = require('os');

export class EnvironmentInspector implements IServerRequestInspector {
    private agent: IAgent;

    public requestStart(req: IncomingMessage, res: ServerResponse, requestStartTime: DateTimeValue) {
        // no-op
    }

    //tslint:disable-next-line:no-any
    public requestEnd(req: IncomingMessage, res: ServerResponse, content: Array<any>, size: number, requestStartTime: DateTimeValue) {

        const context = HttpHelper.getContext(req);
        if (context) {

            const currentMoment = requestStartTime.getMoment();

            this.agent.broker.createAndSendMessage(
                {
                    serverName: os.hostname(),
                    serverTime: requestStartTime.format(false),
                    serverTimezoneOffset: requestStartTime.getUTCOffset(true),
                    serverDaylightSavingTime: currentMoment.isDST(),
                    serverOperatingSystem: os.type(),
                    runtimeVersion: process.version,
                    runtimeArchitecture: os.arch()
                },
                ['environment'],
                undefined,
                context
            );
        }
    }

    public responseStart(req: IncomingMessage, res: ServerResponse, responseStartTime: DateTimeValue): void {
        // TODO: Remove once http-proxy allows for removal.
    }

    // tslint:disable-next-line:no-any
    public responseEnd(req: IncomingMessage, res: ServerResponse, content: Array<any>, size: number, responseStartTime: DateTimeValue): void {
        // TODO: Remove once http-proxy allows for removal.
    }

    public init(agent: IAgent) {
        this.agent = agent;
    }
}
