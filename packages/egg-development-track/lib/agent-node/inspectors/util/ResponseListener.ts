'use strict';

import * as _ from 'lodash';
import * as events from 'events';
import * as http from 'http';

export interface ServerResponseWithInternals extends http.ServerResponse {
    _header?: string;
    _trailer?: string;
}

export class ResponseListener extends events.EventEmitter {
    private static glimpseResponseListenerProperty = '__glimpseResponseListener';

    public static bodyEvent = 'body';
    public static headersEvent = 'headers';
    public static statusCodeEvent = 'statusCode';
    public static statusMessageEvent = 'statusMessage';

    private _sentStatusCode: number;
    private _sentStatusMessage: string;

    constructor(res: http.ServerResponse) {
        super();

        this.patchResponseAddTrailers(res);
        this.patchResponseSetHeader(res);
        this.patchResponseSetStatusCode(res);
        this.patchResponseSetStatusMessage(res);
        this.patchResponseWrite(res);
    }

    public static attachListener(res: http.ServerResponse): ResponseListener {
        let responseListener = res[ResponseListener.glimpseResponseListenerProperty];

        if (!responseListener) {
            responseListener = new ResponseListener(res);

            res[ResponseListener.glimpseResponseListenerProperty] = responseListener;
        }

        return responseListener;
    }

    public static getAllHeaders(res: ServerResponseWithInternals): { [key: string]: string[] } {
        // NOTE: The _header and _trailer properties are implementation details of the Node runtime.
        //       These properties are populated as the response is being written to the wire.
        //       As Node writes certain headers (e.g. Date, Connection) only as the response is written,
        //       we use the properties to ensure we capture *all* headers, not just those written by
        //       the application.

        const headers: { [key: string]: string[] } = {};

        ResponseListener.addFormattedHeaders(headers, res._header);
        ResponseListener.addFormattedHeaders(headers, res._trailer);

        return headers;
    }

    /**
     * Returns the status code actually sent to the client (as this may be different than `statusCode`).
     * 
     * Notes: 
     * 
     *  - If headers have not yet been sent, then the value returned is what *would* be sent.
     * 
     *  - If headers were sent before the attachment of this listener, then the value returned
     *    will be the value of `statusCode` at the time of attachment (and in that case may not
     *    be the *actual* value sent to the client). 
     */
    public get sentStatusCode(): number {
        return this._sentStatusCode;
    }

    /**
     * Returns the status message actually sent to the client (as this may be different than `statusMessage`).
     * 
     * Notes: 
     * 
     *  - If headers have not yet been sent, then the value returned is what *would* be sent.
     * 
     *  - If headers were sent before the attachment of this listener, then the value returned
     *    will be the value of `statusMessage` at the time of attachment (and in that case may not
     *    be the *actual* value sent to the client). 
     */
    public get sentStatusMessage(): string {
        return this._sentStatusMessage;
    }

    private static addFormattedHeaders(headers: { [key: string]: string[] }, formattedHeaders: string) {
        if (formattedHeaders) {
            const splitHeaders = formattedHeaders.split('\r\n');

            splitHeaders.forEach(splitHeader => {
                const index = splitHeader.indexOf(': ');

                if (index >= 0) {
                    const name = splitHeader.substring(0, index);
                    const value = splitHeader.substring(index + 2);

                    if (name) {
                        const loweredName = name.toLowerCase();

                        if (headers[loweredName]) {
                            headers[loweredName].push(value);
                        }
                        else {
                            headers[loweredName] = [value];
                        }
                    }
                }
            });
        }
    }

    private patchResponseSetHeader(res: http.ServerResponse) {
        const oldSetHeader = res.setHeader;

        const self = this;

        res.setHeader = function newSetHeader(name, value: number | string | string[]) {

            oldSetHeader.apply(this, arguments);

            const newHeaders: { [key: string]: string[] } = {};

            if (Array.isArray(value)) {
                newHeaders[name.toLowerCase()] = value;
            }
            else {
                newHeaders[name.toLowerCase()] = [ value.toString() ];
            }

            self.publishHeaderChanges(newHeaders);
        };
    }

    private patchResponseAddTrailers(res: http.ServerResponse) {
        const oldAddTrailers = res.addTrailers;

        const self = this;

        res.addTrailers = function newAddTrailers(headers: { [key: string]: string }) {

            oldAddTrailers.apply(this, arguments);

            const newHeaders: { [key: string]: string[] } = {};

            _.forOwn(headers, (value, key) => {
                newHeaders[key.toLowerCase()] = [ value ];
            });

            self.publishHeaderChanges(newHeaders);
        };
    }

    private publishHeaderChanges(headers: { [key: string]: string[] }) {
        this.emit(ResponseListener.headersEvent, headers);
    }

    private patchResponseSetStatusCode(res: http.ServerResponse) {
        let currentStatusCode = this._sentStatusCode = res.statusCode;

        const self = this;

        Object.defineProperty(res, 'statusCode', {
            get: function () {
                return currentStatusCode;
            },
            set: function(value) {

                currentStatusCode = value;

                if (!res.headersSent) {
                    self._sentStatusCode = currentStatusCode;
                }

                self.emit(ResponseListener.statusCodeEvent, currentStatusCode);
            }
        });
    }

    private patchResponseSetStatusMessage(res: http.ServerResponse) {
        let currentStatusMessage = this._sentStatusMessage = res.statusMessage;

        const self = this;

        Object.defineProperty(res, 'statusMessage', {
            get: function () {
                return currentStatusMessage;
            },
            set: function(value) {

                currentStatusMessage = value;

                if (!res.headersSent) {
                    self._sentStatusMessage = currentStatusMessage;
                }

                self.emit(ResponseListener.statusMessageEvent, currentStatusMessage);
            }
        });
    }

    private patchResponseWrite(res: http.ServerResponse) {
        const oldWrite = res.write;
        const self = this;

        res.write = function newWrite(data) {
            const result = oldWrite.apply(this, arguments);

            // Ignore writes of empty data...
            //
            // NOTE: Express <=4.6 APIs will itself ignore empty-string writes.
            //       Express >=4.7 APIs convert empty-string-writes to Buffers and pass them to write().
            if (data && data.length) {
                self.emit(ResponseListener.bodyEvent);
            }

            return result;
        };
    }
}
