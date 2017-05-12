import { IAgent } from '../IAgent';
import { IMessage } from '../messaging/IMessage';
import { IContext } from '../messaging/IContextManager';
import { IInstrumentationEvent } from '../tracing/IInstrumentationEvent';
import { DateTimeValue } from '../configuration/DateTimeValue';
import { createHttpClientError, IErrorReportingService } from '../../common';
import { default as tracing, IEventCallback } from '../tracing/Tracing';
import { HttpHelper, IBodyProperty } from '../util/HttpHelper';
import { createMultiPartFormSummarizer, IMultiPartFormSummarizer } from '../util/MultiPartFormSummarizer';
import { IStackHelper, IStackFrame } from './util/StackHelper';
import { IMessageConverter } from '../messaging/IMessageConverter';

import {
  EVENT_HTTP_CLIENT_REQUEST_CREATED, IClientRequestCreatedEvent,
  EVENT_HTTP_CLIENT_REQUEST_DATA_SENT, IClientRequestDataSentEvent,
  EVENT_HTTP_CLIENT_REQUEST_END, IClientRequestEndEvent,
  EVENT_HTTP_CLIENT_REQUEST_ERROR, IClientRequestErrorEvent,
  EVENT_HTTP_CLIENT_RESPONSE_RECEIVED, IClientResponseReceivedEvent,
  EVENT_HTTP_CLIENT_RESPONSE_DATA_RECEIVED, IClientResponseDataReceivedEvent,
  EVENT_HTTP_CLIENT_RESPONSE_END, IClientResponseEndEvent,
  EVENT_HTTP_CLIENT_RESPONSE_ERROR, IClientResponseErrorEvent,
} from '../tracing/module_instrumentors/HttpEvents';
import { ClientRequest, IncomingMessage } from 'http';

import url = require('url');
import * as _ from 'lodash';

export interface IDataHttpRequestPayload {
  protocol: {
    identifier: string;
    version: string;
  };
  url: string;
  method: string;
  frames: IStackFrame[];
  startTime: string;
  headers: { [key: string]: string | string[] };
  isAjax: boolean;
  clientIp: string;
  body: IBodyProperty;
  timing: {
    startTime: number,
  };
  correlationId: string;
}

export interface IDataHttpResponsePayload {
  // res.url doesn't seem to be populated in practice
  url: string;
  headers: { [key: string]: string | string[] };
  statusCode: number;
  statusMessage: string;
  endTime: string;
  duration: number;
  body: IBodyProperty;
  timing: {
    startTime: number;
    responseStart: number;
    responseEnd: number;
  };
  correlationId: string;
}

export interface IRequestData {
  requestCreatedTime: DateTimeValue;
  requestStartTime: DateTimeValue;
  responseStartTime: DateTimeValue;
  responseEndTime: DateTimeValue;
  duration: number;
  // tslint:disable-next-line:no-any
  options;
  request: ClientRequest;
  response: IncomingMessage;
  requestBodyChunks: Array<Buffer | string>;
  requestBodyLength: number;
  responseBodyChunks: Array<Buffer | string>;
  responseBodyLength: number;
  correlationId: string;
  isMultiPartFormData: boolean;
  multiPartFormSummarizer: IMultiPartFormSummarizer;
  responseMessage: IMessage<IDataHttpResponsePayload>;
  context: IContext;
}

export class ClientRequestInspector {
  private agent: IAgent;
  private requests: { [requestId: string]: IRequestData } = {};
  private listeners: { [eventName: string]: IEventCallback } = {};
  private errorReportingService: IErrorReportingService;
  private stackHelper: IStackHelper;
  private messageConverter: IMessageConverter;

  public numOutstandingRequests() {
    return Object.keys(this.requests).length;
  }

  public before(masterData: IRequestData): void {
    if (masterData.context) {
      const frame: IStackFrame = this.stackHelper.tryGetFirstUserCodeFrame(
        this.stackHelper.captureStack(this.before, 20),
      );
      const frames: IStackFrame[] = [frame];
      // convert any numeric header values to strings to conform to json schema definition
      // Note: this uses a private field on the request object. Sadly, there isn't another way to get these currently.
      // tslint:disable-next-line:no-any
      const headers = _.assign({}, (masterData.request as any)._headers);
      for (const k in headers) {
        if (headers.hasOwnProperty(k)) {
          if (typeof headers[k] === 'number') {
            headers[k] = `${headers[k]}`;
          }
        }
      }

      const payload: IDataHttpRequestPayload = {
        protocol: {
          identifier: masterData.options.protocol.replace(':', '').toLowerCase(),
          // This value is hard coded in Node:
          // https://github.com/nodejs/node/blob/d0582ef9e19e8ed941b0a585c935ad11919080ee/lib/_http_client.js#L114
          version: '1.1',
        },
        url: url.format(masterData.options),
        // The method property isn't documented in the typings definition, for some reason
        // tslint:disable-next-line:no-any
        method: (masterData.request as any).method,
        startTime: masterData.requestStartTime.format(),
        headers,
        frames,
        isAjax: false,
        // TODO: Is this field relevant, since it's the IP of this system?
        // We can get the list of interfaces from os.networkInterfaces()
        clientIp: '127.0.0.1',
        body: HttpHelper.createMessageBodyProperty(
          masterData.request,
          masterData.requestBodyChunks,
          masterData.requestBodyLength,
          this.agent.providers.configSettings,
          masterData.multiPartFormSummarizer ? masterData.multiPartFormSummarizer.getParts() : [],
        ),
        timing: {
          startTime: 0,
        },
        correlationId: masterData.correlationId,
      };

      // TODO:  when we detect "first byte on wire" for send,
      // we'll want to create the message envelope so it has the correct offset,
      // and then send it here
      const message = this.messageConverter.createMessageEnvelope<IDataHttpRequestPayload>(
        ['data-http-request', 'call-stack'], undefined, masterData.context,
      );
      message.payload = payload;

      this.stackHelper.mapFrames(payload.frames, (mappedFrames) => {
        payload.frames = mappedFrames;
        const transformedMessage = this.messageConverter.transformMessageForTransit(message, message.payload);
        this.agent.broker.sendMessage(transformedMessage);
      });
    }
  }

  public after(masterData: IRequestData): void {
    if (masterData.context && masterData.responseMessage) {
      const payload: IDataHttpResponsePayload = {
        // res.url doesn't seem to be populated in practice
        url: masterData.response.url || url.format(masterData.options),
        headers: masterData.response.headers,
        statusCode: masterData.response.statusCode,
        statusMessage: masterData.response.statusMessage,
        endTime: masterData.responseEndTime.format(),
        duration: masterData.duration,
        body: HttpHelper.createMessageBodyProperty(
          masterData.response,
          masterData.responseBodyChunks,
          masterData.responseBodyLength,
          this.agent.providers.configSettings,
        ),
        timing: {
          startTime: 0, // start time is always relative to this http request, so it's always 0
          responseStart: masterData.responseStartTime.diff(masterData.requestStartTime),
          responseEnd: masterData.responseEndTime.diff(masterData.requestStartTime),
        },
        correlationId: masterData.correlationId,
      };

      const transmittableMessage = this.agent.providers.messageConverter.transformMessageForTransit(
        masterData.responseMessage,
        payload,
      );
      this.agent.broker.sendMessage(transmittableMessage);
    }
  }

  public init(agent: IAgent, errorReportingService: IErrorReportingService) {
    this.agent = agent;
    this.errorReportingService = errorReportingService;
    this.stackHelper = agent.providers.stackHelper;
    this.messageConverter = agent.providers.messageConverter;

    this.listeners = {
      [EVENT_HTTP_CLIENT_REQUEST_CREATED]: (event) => this.onRequestCreated(event),
      [EVENT_HTTP_CLIENT_REQUEST_DATA_SENT]: (event) => this.onRequestDataSent(event),
      [EVENT_HTTP_CLIENT_REQUEST_END]: (event) => this.onRequestEnd(event),
      [EVENT_HTTP_CLIENT_REQUEST_ERROR]: (event) => this.onRequestError(event),
      [EVENT_HTTP_CLIENT_RESPONSE_RECEIVED]: (event) => this.onResponseReceived(event),
      [EVENT_HTTP_CLIENT_RESPONSE_DATA_RECEIVED]: (event) => this.onResponseDataReceived(event),
      [EVENT_HTTP_CLIENT_RESPONSE_END]: (event) => this.onResponseEnd(event),
      [EVENT_HTTP_CLIENT_RESPONSE_ERROR]: (event) => this.onResponseError(event),
    };
    for (const event in this.listeners) {
      if (!this.listeners.hasOwnProperty(event)) {
        continue;
      }
      tracing.onAlways(event, this.listeners[event]);
    }
  }

  public removeEventListeners() {
    for (const event in this.listeners) {
      if (!this.listeners.hasOwnProperty(event)) {
        continue;
      }
      tracing.removeEventListener(event, this.listeners[event]);
    }
  }

  private normalizeOptions(options, req) {
    // Normalize to a copy of the original options
    if (typeof options === 'string') {
      options = url.parse(options);
    }
    options = _.assign({}, options);

    // Oddly, url.format ignores path and only uses pathname and search,
    // so create them from the path, if path was specified
    if (options.path) {
      const parsedQuery = url.parse(options.path);
      options.pathname = parsedQuery.pathname;
      options.search = parsedQuery.search;
    }

    // Simiarly, url.format ignores hostname and path if host is specified,
    // even if host doesn't have the port, but http.request does not work
    // this way. It will use the port if one is not specified in host,
    // effectively treating host as hostname, but will use the port specified
    // in host if it exists. Fun times.
    if (options.host && options.port) {
      // Force a protocol so it will parse the host as the host, not path.
      // It is discarded and not used, so it doesn't matter if it doesn't match
      const parsedHost = url.parse(`http://${options.host}`);
      if (!parsedHost.port && options.port) {
        options.hostname = options.host;
        delete options.host;
      }
    }

    // Mix in default values used by http.request and others
    options.protocol = options.protocol || req.agent.protocol;
    options.hostname = options.hostname || 'localhost';

    return options;
  }

  private onRequestCreated(event: IInstrumentationEvent): void {
    const eventData: IClientRequestCreatedEvent = event.data;

    const context = this.agent.providers.contextManager.currentContext();
    if (context) {
      HttpHelper.setContext(eventData.req, context);
    }

    this.requests[eventData.id] = {
      requestCreatedTime: DateTimeValue.fromUnixMillisecondTimestamp(event.timestamp, event.time),
      requestStartTime: undefined,
      responseStartTime: undefined,
      responseEndTime: undefined,
      duration: 0,
      options: this.normalizeOptions(eventData.options, eventData.req),
      request: eventData.req,
      response: undefined,
      requestBodyChunks: [],
      requestBodyLength: 0,
      responseBodyChunks: [],
      responseBodyLength: 0,
      correlationId: eventData.id,
      isMultiPartFormData: undefined,
      multiPartFormSummarizer: undefined,
      responseMessage: undefined,
      context,
    };
  }

  private onRequestDataSent(event: IInstrumentationEvent): void {
    const eventData: IClientRequestDataSentEvent = event.data;
    const masterData = this.requests[eventData.id];
    if (!masterData) {
      throw new Error('Internal error: could not find associated master data');
    }

    if (masterData.context) {
      // Save part or all of the chunk to the set of chunks,
      // truncating if necessary to keep the set under the
      // max body size
      const originalChunkLength = eventData.chunk.length;
      let normalizedChunk = eventData.chunk;
      const maxBodySize = HttpHelper.getMaxBodySize(this.agent.providers.configSettings);
      if (masterData.requestBodyLength < maxBodySize) {
        if (masterData.requestBodyLength + originalChunkLength >= maxBodySize) {
          normalizedChunk = normalizedChunk.slice(0, maxBodySize - masterData.requestBodyLength);
        }
        masterData.requestBodyChunks.push(normalizedChunk);
      }
      masterData.requestBodyLength += originalChunkLength;

      // create the multipart/form-data summarizer if this is a multipart/form-data request
      if (masterData.isMultiPartFormData === undefined) {
        masterData.multiPartFormSummarizer = createMultiPartFormSummarizer(
          masterData.request.getHeader('content-type'),
        );
        if (masterData.multiPartFormSummarizer) {
          masterData.isMultiPartFormData = true;
        } else {
          masterData.isMultiPartFormData = false;
        }
      }

      // if we have a summarizer, send this chunk to it
      if (masterData.multiPartFormSummarizer) {
        masterData.multiPartFormSummarizer.addChunk(eventData.chunk);
      }
    }
  }

  private onRequestEnd(event: IInstrumentationEvent): void {
    const eventData: IClientRequestEndEvent = event.data;
    const masterData = this.requests[eventData.id];
    if (!masterData) {
      throw new Error('Internal error: could not find associated master data');
    }
    // TODO:  Ideally, we'd have some hooks that detect "first byte on the wire", and we'd set requestStartTime to that.
    //        in lieu of that, we assume that "request end" marks the "first byte on the wire"
    masterData.requestStartTime = DateTimeValue.fromUnixMillisecondTimestamp(event.timestamp, event.time);
    this.before(masterData);
  }

  private onRequestError(event: IInstrumentationEvent): void {
    const eventData: IClientRequestErrorEvent = event.data;
    const masterData = this.requests[eventData.id];
    if (!masterData) {
      throw new Error('Internal error: could not find associated master data');
    }
    delete this.requests[eventData.id];
    this.errorReportingService.reportError(createHttpClientError(eventData.error));
  }

  private onResponseReceived(event: IInstrumentationEvent): void {
    const eventData: IClientResponseReceivedEvent = event.data;
    const masterData = this.requests[eventData.id];
    if (!masterData) {
      throw new Error('Internal error: could not find associated master data');
    }

    if (masterData.context) {
      masterData.response = eventData.res;
      HttpHelper.setContext(masterData.response, masterData.context);
      // create the message envelope now so the offset value & the ordinal & offset will reflect the start of response
      masterData.responseMessage =
        this.agent.providers.messageConverter.createMessageEnvelope<IDataHttpResponsePayload>(
          ['data-http-response'], undefined, masterData.context,
        );
      masterData.responseStartTime = DateTimeValue.fromUnixMillisecondTimestamp(event.timestamp, event.time);
    }
  }

  private onResponseDataReceived(event: IInstrumentationEvent): void {
    const eventData: IClientResponseDataReceivedEvent = event.data;
    const masterData = this.requests[eventData.id];
    if (!masterData) {
      throw new Error('Internal error: could not find associated master data');
    }

    if (masterData.context) {
      // Save part or all of the chunk to the set of chunks,
      // truncating if necessary to keep the set under the
      // max body size
      const originalChunkLength = eventData.chunk.length;
      let normalizedChunk = eventData.chunk;
      const maxBodySize = HttpHelper.getMaxBodySize(this.agent.providers.configSettings);
      if (masterData.responseBodyLength < maxBodySize) {
        if (masterData.responseBodyLength + originalChunkLength >= maxBodySize) {
          normalizedChunk = normalizedChunk.slice(0, maxBodySize - masterData.responseBodyLength);
        }
        masterData.responseBodyChunks.push(normalizedChunk);
      }
      masterData.responseBodyLength += originalChunkLength;
    }
  }

  private onResponseEnd(event: IInstrumentationEvent): void {
    const eventData: IClientResponseEndEvent = event.data;
    const masterData = this.requests[eventData.id];
    if (!masterData) {
      throw new Error('Internal error: could not find associated master data');
    }

    if (masterData.context) {
      masterData.responseEndTime = DateTimeValue.fromUnixMillisecondTimestamp(event.timestamp, event.time);
      masterData.duration = masterData.responseEndTime.diff(masterData.requestStartTime);
      this.after(masterData);
    }

    delete this.requests[eventData.id];
  }

  private onResponseError(event: IInstrumentationEvent): void {
    const eventData: IClientResponseErrorEvent = event.data;
    const masterData = this.requests[eventData.id];
    if (!masterData) {
      throw new Error('Internal error: could not find associated master data');
    }
    delete this.requests[eventData.id];
    this.errorReportingService.reportError(createHttpClientError(eventData.error));
  }
}
