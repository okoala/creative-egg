'use strict';

import { v1 as generateUUID } from 'uuid';
import { ClientRequest, IncomingMessage } from 'http';
import tracing from '../Tracing';
import {
    EVENT_HTTP_CLIENT_REQUEST_CREATED, IClientRequestCreatedEvent,
    EVENT_HTTP_CLIENT_REQUEST_DATA_SENT, IClientRequestDataSentEvent,
    EVENT_HTTP_CLIENT_REQUEST_END, IClientRequestEndEvent,
    EVENT_HTTP_CLIENT_REQUEST_ERROR, IClientRequestErrorEvent,
    EVENT_HTTP_CLIENT_RESPONSE_RECEIVED, IClientResponseReceivedEvent,
    EVENT_HTTP_CLIENT_RESPONSE_DATA_RECEIVED, IClientResponseDataReceivedEvent,
    EVENT_HTTP_CLIENT_RESPONSE_END, IClientResponseEndEvent,
    EVENT_HTTP_CLIENT_RESPONSE_ERROR, IClientResponseErrorEvent
} from './HttpEvents';
import { IModuleInfo } from '../IModuleInfo';

export class HttpClientProxy {

    private proxiedModules = [];

    // Helper methods for publishing events. We break these out into separate
    // methods so we can enforce type checking for the event interfaces

    private publishRequestCreatedEvent(data: IClientRequestCreatedEvent): void {
        tracing.publish(EVENT_HTTP_CLIENT_REQUEST_CREATED, data);
    }

    private publishRequestDataSentEvent(data: IClientRequestDataSentEvent): void {
        tracing.publish(EVENT_HTTP_CLIENT_REQUEST_DATA_SENT, data);
    }

    private publishRequestEndEvent(data: IClientRequestEndEvent): void {
        tracing.publish(EVENT_HTTP_CLIENT_REQUEST_END, data);
    }

    private publishRequestErrorEvent(data: IClientRequestErrorEvent): void {
        tracing.publish(EVENT_HTTP_CLIENT_REQUEST_ERROR, data);
    }

    private publishResponseReceivedEvent(data: IClientResponseReceivedEvent): void {
        tracing.publish(EVENT_HTTP_CLIENT_RESPONSE_RECEIVED, data);
    }

    private publishResponseDataReceivedEvent(data: IClientResponseDataReceivedEvent): void {
        tracing.publish(EVENT_HTTP_CLIENT_RESPONSE_DATA_RECEIVED, data);
    }

    private publishResponseEndEvent(data: IClientResponseEndEvent): void {
        tracing.publish(EVENT_HTTP_CLIENT_RESPONSE_END, data);
    }

    private publishResponseErrorEvent(data: IClientResponseErrorEvent): void {
        tracing.publish(EVENT_HTTP_CLIENT_RESPONSE_ERROR, data);
    }

    public init(moduleInfo: IModuleInfo) {
        const httpModule = moduleInfo.originalModule;
        if (this.proxiedModules.indexOf(httpModule) !== -1) {
            throw new Error('Cannot proxy a module that has already been proxied');
        }
        this.proxiedModules.push(httpModule);

        const oldRequest = httpModule.request;
        const self = this;
        httpModule.request = function request(options, ...requestArgs) {
            const req: ClientRequest = oldRequest.call(this, options, ...requestArgs);
            const id = generateUUID();

            if (tracing.isEventEnabled(EVENT_HTTP_CLIENT_REQUEST_CREATED)) {
                self.publishRequestCreatedEvent({ id, req, options });
            }

            req.on('response', (res: IncomingMessage) => {
                if (tracing.isEventEnabled(EVENT_HTTP_CLIENT_RESPONSE_RECEIVED)) {
                    self.publishResponseReceivedEvent({ id, req, res });
                }

                res.on('data', (chunk) => {
                    if (tracing.isEventEnabled(EVENT_HTTP_CLIENT_RESPONSE_DATA_RECEIVED)) {
                        self.publishResponseDataReceivedEvent({ id, req, res, chunk });
                    }
                });

                res.on('end', () => {
                    if (tracing.isEventEnabled(EVENT_HTTP_CLIENT_RESPONSE_END)) {
                        self.publishResponseEndEvent({ id, req, res });
                    }
                });

                res.on('error', (error) => {
                    if (tracing.isEventEnabled(EVENT_HTTP_CLIENT_RESPONSE_ERROR)) {
                        self.publishResponseErrorEvent({ id, req, res, error });
                    }
                });
            });

            req.on('error', (error) => {
                if (tracing.isEventEnabled(EVENT_HTTP_CLIENT_REQUEST_ERROR)) {
                    self.publishRequestErrorEvent({ id, req, error });
                }
            });

            // Note: it's possible to write data using the `end` method as well,
            // but that method calls `write` under the hood, and patching both
            // leads to a doubly patched write method, which duplicates the body
            const oldWrite = req.write;
            req.write = function(chunk, ...writeArgs) {
                const result = oldWrite.call(this, chunk, ...writeArgs);
                if ((typeof chunk === 'string' || Buffer.isBuffer(chunk)) &&
                    tracing.isEventEnabled(EVENT_HTTP_CLIENT_REQUEST_DATA_SENT)
                ) {
                    self.publishRequestDataSentEvent({ id, req, chunk });
                }
                return result;
            };

            const oldEnd = req.end;
            req.end = function end(...endArgs) {
                const result = oldEnd.apply(this, endArgs);
                if (tracing.isEventEnabled(EVENT_HTTP_CLIENT_REQUEST_END)) {
                    self.publishRequestEndEvent({ id, req });
                }
                return result;
            };

            return req;
        };
    }
}
