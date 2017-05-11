'use strict';

import http = require('http');
import { IErrorReportingService, createHttpServerError, createHttpServerEarlyRequestTerminationError } from '@glimpse/glimpse-common';
import { IContext } from '../messaging/IContextManager';
import { IAgent } from '../IAgent';
import { IServerRequestInspector, IPartSummary } from './IServerRequestInspector';
import { ProxyBase } from './ProxyBase';
import { RequestHelper, ResponseHelper, HttpHelper } from '../util/HttpHelper';
import { createMultiPartFormSummarizer, IMultiPartFormSummarizer } from '../util/MultiPartFormSummarizer';
import { GuidHelper } from '../util/GuidHelper';
import { DateTimeValue } from '../configuration/DateTimeValue';

const SESSION_COOKIE = '.Glimpse.Session';
const REQUEST_ID_COOKIE = '.Glimpse.RequestId';
const IS_AJAX_HEADER = 'X-Glimpse-IsAjax';

export class HttpProxy extends ProxyBase {
    private inspectors: IServerRequestInspector[] = [];
    private proxiedModules = [];
    private agent: IAgent;
    private errorReportingService: IErrorReportingService;

    public get moduleName() { return 'http'; };

    public get forceLoadModule(): boolean {
        return false;
    }

    private raiseRequestStartEvent(req: http.IncomingMessage, res: http.ServerResponse, requestStartTime: DateTimeValue): void {
        for (const inspector of this.inspectors) {
            inspector.requestStart(req, res, requestStartTime);
        }
    }

    // tslint:disable-next-line:no-any
    private raiseRequestEndEvent(req: http.IncomingMessage, res: http.ServerResponse, content: Array<any>, size: number, requestStartTime: DateTimeValue, multiPartSummaries: IPartSummary[]): void {
        for (const inspector of this.inspectors) {
            inspector.requestEnd(req, res, content, size, requestStartTime, multiPartSummaries);
        }
    }

    // tslint:disable-next-line:no-any
    private raiseResponseStartEvent(req: http.IncomingMessage, res: http.ServerResponse, responseStartTime: DateTimeValue): void {
        for (const inspector of this.inspectors) {
            inspector.responseStart(req, res, responseStartTime);
        }
    }

    // tslint:disable-next-line:no-any
    private raiseResponseEndEvent(req: http.IncomingMessage, res: http.ServerResponse, content: Array<any>, size: number, responseStartTime: DateTimeValue): void {
        for (const inspector of this.inspectors) {
            inspector.responseEnd(req, res, content, size, responseStartTime);
        }
    }

    private getCurrentTimeStamp(): DateTimeValue {
        return DateTimeValue.fromUnixMillisecondTimestamp(Date.now(), process.hrtime());
    }

    private setupServerProxy(agent: IAgent, httpModule): void {
        const oldCreateServer = httpModule.createServer;
        const self = this;
        const maxBodySize = HttpHelper.getMaxBodySize(agent.providers.configSettings);
        httpModule.createServer = function createServer(options, cb, ...args) {
            function internalCallback(req: http.IncomingMessage, res: http.ServerResponse, ...rest) {
                const requestStartTime: DateTimeValue = self.getCurrentTimeStamp();
                agent.providers.contextManager.runInNewContext(req, (context: IContext) => {
                    // store context on req/response
                    HttpHelper.setContext(req, context);
                    HttpHelper.setContext(res, context);

                    self.raiseRequestStartEvent(req, res, requestStartTime);

                    // It is possible in some circumstances that `res.end()` is
                    // called before the `data` event on the `req` object is
                    // fired. In this case, we check this flag and send the before
                    // event immediately before sending the end event.
                    let requestEndSent = false;

                    // Note: the User Inspector class was rolled into this one
                    // because the begin/end events weren't fine graind enough
                    // to set these headers at the appropriate time. Once this
                    // module is ported to the new proxy paradigm, this can be
                    // split back into a separate inspector
                    // BEGIN code from UserInspector
                    const requestCookies = RequestHelper.parseCookies(req);
                    const userId = requestCookies ? requestCookies[SESSION_COOKIE] : undefined;
                    if (!userId) {
                        ResponseHelper.setCookie(res, SESSION_COOKIE, GuidHelper.newGuid(false));
                    }
                    // END code from UserInspector

                    res.setHeader('X-Glimpse-ContextId', context.id);

                    // General performance note for this implementation: this has been identified
                    // as a hot path for performance, so there are places where maintainability
                    // and readability are sacrificed for performance. Specifically, there is
                    // repeated code in here that could be abstracted into helper methods, but
                    // would incure the extra stack frame and slow things down

                    // Note on Buffers. We use Buffers to store body requests, and we
                    // create new buffers a few times as well. We use the Buffer consructor
                    // to do this for backwards compatibility reasons, but we should
                    // migrate away some day. There is a security risk with using the
                    // Buffer constructor, which is why it's been deprecated. More info:
                    // https://nodejs.org/api/buffer.html#buffer_buffer_from_buffer_alloc_and_buffer_allocunsafe

                    // Chunks may be read back as either Buffers or strings. For now we store
                    // them as an array of chunks, and let inspectors figure out the best way
                    // to normalize them.
                    let requestBodyChunks = [];
                    let requestBodyLength = 0;

                    let bufferedData = [];
                    let isBufferingData = true;

                    let isMultiPartFormData: boolean = undefined;
                    let multiPartFormSummarizer: IMultiPartFormSummarizer = undefined;

                    req.on('data', (chunk) => {
                        agent.providers.contextManager.checkContextID('HttpProxy::(request - on(\'data\')', context.id);

                        // set up a parser to parse out headers if this is a multi-part form request
                        if (isMultiPartFormData === undefined) {
                            multiPartFormSummarizer = createMultiPartFormSummarizer(req.headers['content-type']);
                            if (multiPartFormSummarizer) {
                                isMultiPartFormData = true;
                            }
                            else {
                                isMultiPartFormData = false;
                            }
                        }

                        if (isBufferingData) {
                            bufferedData.push(chunk);
                        }

                        if (isMultiPartFormData) {
                            multiPartFormSummarizer.addChunk(chunk);
                        }

                        const originalChunkLength = chunk.length;
                        if (requestBodyLength < maxBodySize) {
                            if (requestBodyLength + originalChunkLength >= maxBodySize) {
                                chunk = chunk.slice(0, maxBodySize - requestBodyLength);
                            }
                            requestBodyChunks.push(chunk);
                        }
                        requestBodyLength += originalChunkLength;
                    });

                    let isBufferingEnd = false;

                    req.on('end', () => {
                        isBufferingEnd = true;

                        // TODO:  renable this check when we have an effective context tracking implementation in place
                        //agent.providers.contextManager.checkContextID('HttpProxy::(request - on(\'end\')', context.id);
                        if (!requestEndSent) {
                            self.raiseRequestEndEvent(req, res, requestBodyChunks, requestBodyLength, requestStartTime, multiPartFormSummarizer ? multiPartFormSummarizer.getParts() : []);
                            requestEndSent = true;
                        }
                    });

                    req.on('error', (err: Error | string) => {
                        self.errorReportingService.reportError(createHttpServerError(err));
                    });

                    res.on('error', (err: Error | string) => {
                        self.errorReportingService.reportError(createHttpServerError(err));
                    });

                    // NOTE: We MUST be subscribed to the 'data' and 'end' events PRIOR to patching 'on()'.

                    const oldOn = req.on;
                    req.on = function newOn(event, onCallback, ...onRest) {
                        if (isBufferingData && event === 'data') {
                            try {
                                bufferedData.forEach(chunk => {
                                    onCallback.call(this, chunk);
                                });
                            }
                            finally {
                                bufferedData = [];
                                isBufferingData = false;
                            }
                        }
                        else if (isBufferingEnd && event === 'end') {
                            onCallback.call(this);
                        }

                        return oldOn.call(this, event, onCallback, ...onRest);
                    };

                    // Note: it's possible to write data using the `end` method as well,
                    // but that method calls `write` under the hood, and patching both
                    // leads to a doubly patched write method, which duplicates the body
                    let responseBodyChunks = [];
                    let responseBodyLength = 0;
                    const oldWrite = res.write;
                    let responseStartTime = undefined;
                    res.write = function (chunk, encoding?, ...writeArgs): boolean {
                        if (!responseStartTime) {
                            responseStartTime = self.getCurrentTimeStamp();
                            self.raiseResponseStartEvent(req, res, responseStartTime);
                        }

                        // TODO:  renable this check when we have an effective context tracking implementation in place
                        //agent.providers.contextManager.checkContextID('HttpProxy::(response.write())', context.id);

                        // Short circuit if we're not actually writing anything
                        if (typeof chunk === 'function' || typeof chunk === 'undefined') {
                            return oldWrite.call(this, chunk, encoding, ...writeArgs);
                        }

                        // If we don't have the necessary information to normalize
                        // to a string, the underlying API will throw, so we short
                        // circuit here and call the underlying API
                        if (typeof chunk !== 'string' && !Buffer.isBuffer(chunk)) {
                            return oldWrite.call(this, chunk, encoding, ...writeArgs);
                        }

                        // Save part or all of the chunk to the set of chunks,
                        // truncating if necessary to keep the set under the
                        // max body size
                        const originalChunkLength = chunk.length;
                        let normalizedChunk = chunk;
                        if (responseBodyLength < maxBodySize) {
                            if (responseBodyLength + originalChunkLength >= maxBodySize) {
                                normalizedChunk = normalizedChunk.slice(0, maxBodySize - responseBodyLength);
                            }
                            responseBodyChunks.push(normalizedChunk);
                        }
                        responseBodyLength += originalChunkLength;

                        return oldWrite.call(this, chunk, encoding, ...writeArgs);
                    };

                    // We override the setHeader method so we can intercept the
                    // content-type and set the request ID header if this is the
                    // first request for the page. We will know if this request
                    // was the first request for the page if it's a) a request
                    // for HTML and b) it's not an AJAX request because it's not
                    // possible to request HTML content after the initial request
                    // *except* via AJAX.
                    const oldSetHeader = res.setHeader;
                    res.setHeader = function setHeader(name, value, ...setHeaderArgs) {
                        oldSetHeader.call(this, name, value, ...setHeaderArgs);
                        if (name.toLowerCase() === 'content-type' && value.indexOf('text/html') === 0 && RequestHelper.header(req, IS_AJAX_HEADER) !== 'true') {
                            ResponseHelper.setCookie(res, REQUEST_ID_COOKIE, context.id);
                        }
                    };

                    res.on('finish', () => {
                        // TODO:  renable this check when we have an effective context tracking implementation in place
                        //agent.providers.contextManager.checkContextID('HttpProxy::(request - on(\'finish\')', context.id);

                        if (!requestEndSent) {
                            // If we got here, it means that the `res.end()` method
                            // was called before the request `end` event was fired.
                            // This could happen for a variety of reasons, mostly
                            // when the user calls `res.end` before the request has
                            // finished flushing. Most often, this happens because
                            // the body has not been recieved, but we try and send
                            // whatever body we have receieved so far.
                            self.raiseRequestEndEvent(req, res, requestBodyChunks, requestBodyLength, requestStartTime, multiPartFormSummarizer ? multiPartFormSummarizer.getParts() : []);
                            requestEndSent = true;

                            // We check to see if content length was set, and if it
                            // was and we haven't seen that much of the body yet,
                            // we report an error that not all of the body was captured
                            const contentLength = RequestHelper.header(req, 'content-length');
                            if (contentLength && contentLength > requestBodyLength && self.errorReportingService) {
                                self.errorReportingService.reportError(createHttpServerEarlyRequestTerminationError(req.url));
                            }
                        }
                        responseStartTime = responseStartTime || self.getCurrentTimeStamp();
                        self.raiseResponseEndEvent(req, res, responseBodyChunks, responseBodyLength, responseStartTime);
                    });

                    if (cb) {
                        cb(req, res, ...rest);
                    }
                });
            };

            // NOTE: Glimpse initialization in the user's app is synchronous (e.g. `glimpse.init()`).
            //       However, there are some Glimpse services that require asynchronous initialization.
            //       In those cases, we defer initialization until just prior to handling the first
            //       request (as that's the first asynchronous hook point provided by Node). When
            //       initialization is complete, we continue processing the request.
            function deferredCallback(req, res, ...rest) {
                agent.providers.deferredInitializationManager.init(err => {
                    if (err) {
                        throw err;
                    }

                    internalCallback(req, res, ...rest);
                });
            }

            // Note: https.createServer and http.createServer have different signatures:
            // http.createServer([callback])
            // https.createServer(options[, callback])
            // We can't inspect the callback type because the callback is optional,
            // but we can inspect the `options` parameter since it is required for
            // HTTPS calls and HTTP calls don't accept an options object
            if (typeof options !== 'object') {
                cb = options;
                return oldCreateServer.call(this, deferredCallback, ...args);
            } else {
                return oldCreateServer.call(this, options, deferredCallback, ...args);
            }
        };
    }

    private setupInspectorExtensions(agent: IAgent): void {
        for (const inspector of this.inspectors) {
            inspector.init(agent);
        }
    }

    public addServerInspector(inspector: IServerRequestInspector) {
        if (this.proxiedModules.length) {
            throw new Error('Cannot add inspectors after the proxy has been initialized for the first time');
        }
        this.inspectors.push(inspector);
    }

    public init(agent: IAgent, httpModule, resolvedModulePath: string, errorReportingService: IErrorReportingService) {
        this.agent = agent;
        this.errorReportingService = errorReportingService;
        // We can only initialize the proxies once, otherwise we will get n
        // copies of all messages because the proxies will nest inside each other
        if (this.proxiedModules.indexOf(httpModule) !== -1) {
            throw new Error('Cannot proxy a module that has already been proxied');
        }
        this.proxiedModules.push(httpModule);
        this.setupServerProxy(agent, httpModule);
        this.setupInspectorExtensions(agent);

        return httpModule;
    };
}
