import logger from '../common/GlimpseLogger';
import { IInspector } from './IInspector';
import { IMessagePublisher } from '../MessagePublisher';
import { IProxyEvent } from '../tracing/IProxyEvent';
import { addOffset } from '../common/MessageMixins';
import { MAX_HTTP_BODY_SIZE } from '../common/Constants';
import {
  IRequestSentEvent, EVENT_XHR_REQUEST_SENT,
  IResponseReceivedEvent, EVENT_XHR_RESPONSE_RECEIVED,
  EVENT_XHR_ERROR,
  EVENT_XHR_ABORT
} from '../tracing/proxies/XHRProxy';
import tracing from '../tracing/Tracing';
import { getDateTime } from '../common/DateTimeUtilities';
import { parseUrl, normalizeHeaders, IHeaders } from '../common/RequestUtilities';
import parse from 'parse-headers';
import {
  tryFindResourceTimingObject,
  getMultiPartFormBoundary,
  getMultiPartFormParts,
  IBody,
  IPartSummary,
  createBodyForBlob,
  createEmptyBody
} from './HttpRequestUtils';
import { getStackTrace } from '../common/CallStackUtilities';

interface IRequestCacheEntry {
  startTimeStamp: number;
  startTimeOffset: number;
}

export class XHRInspector implements IInspector {

  private initiatorRegExp = /xmlhttprequest/i;

  private messagePublisher: IMessagePublisher;

  private requests: { [id: string]: IRequestCacheEntry } = {};

  private createBodyProperty(headers: IHeaders, body: string | ArrayBuffer | ArrayBufferView | Blob | Document | FormData, cb: (bodyProperty: IBody) => void) {
    //
    // Note on use of setTimeout() below.  This is done to ensure all code paths execute asynchronously,
    // irrespective of whether createBodyForBlob is called.  For a more in-depth discussion,
    // see https://nodejs.org/dist/latest-v7.x/docs/api/process.html#process_process_nexttick_callback_args
    //
    if (!body) {
      const bodyProperty = createEmptyBody(false);
      setTimeout(() => cb(bodyProperty), 0);
    }
    else {
      //
      // according to MDN docs, body here can be one of the following types:
      // ArrayBufferView | Blob | Document | string | FormData.  We need to
      // account for all of these.
      //
      if (typeof body === 'string') {
        const contentType = headers['content-type'] as string;
        const boundary = getMultiPartFormBoundary(contentType);
        const bodyProperty: IBody = {
          size: body.length,
          encoding: 'utf8',
          isTruncated: body.length > MAX_HTTP_BODY_SIZE,
          parts: getMultiPartFormParts(boundary, body),
          content: body.slice(0, MAX_HTTP_BODY_SIZE)
        };
        setTimeout(() => cb(bodyProperty), 0);
      }
      else if (body instanceof Blob) {
        const contentType = headers['content-type'] as string;
        const blob = body as Blob;
        createBodyForBlob(contentType, blob, true, (bodyProperty: IBody) => {
          cb(bodyProperty);
        });
      }
      else if (body instanceof ArrayBuffer || ((body as ArrayBufferView).buffer && (body as ArrayBufferView).buffer instanceof ArrayBuffer)) {
        let buffer: ArrayBuffer;
        if (body instanceof ArrayBuffer) {
          buffer = body;
        }
        else {
          buffer = (body as ArrayBufferView).buffer;
        }

        // TODO:  support body capture when body is ArrayBuffer
        const bodyProperty: IBody = {
          size: buffer.byteLength,
          encoding: 'none',
          isTruncated: true,
          parts: [],
          content: ''
        };
        setTimeout(() => cb(bodyProperty), 0);
      }
      else if (body instanceof Document) {
        // TODO:  support body capture when body is Document
        const doc = body as Document;
        const bodyProperty = createEmptyBody(true);
        setTimeout(() => cb(bodyProperty), 0);
      }
      else if (body instanceof FormData) {
        // TODO:  support body capture when body is FormData
        const fd = body as FormData;
        const bodyProperty = createEmptyBody(true);
        setTimeout(() => cb(bodyProperty), 0);
      }
      else if (typeof body === 'object') {
        // TODO:  support body capture when body is object
        const bodyProperty = createEmptyBody(true);
        setTimeout(() => cb(bodyProperty), 0);
      }
      else {
        const bodyProperty = createEmptyBody(true);
        setTimeout(() => cb(bodyProperty), 0);
      }
    }
  }

  private before(event: IProxyEvent) {
    const eventData: IRequestSentEvent = event.data;
    const url = parseUrl(eventData.url);
    const headers = normalizeHeaders(eventData.headers);
    getStackTrace((frames) => {
      this.createBodyProperty(headers, eventData.body, (body: IBody) => {
        const startTime = getDateTime(new Date(event.timeStamp));
        const msg = this.messagePublisher.createMessage(['data-http-request', 'call-stack'], {
          correlationId: eventData.id,
          protocol: {
            identifier: url.protocol.replace(/\:$/, '').toLowerCase()
          },
          url: eventData.url,
          method: eventData.method,
          startTime,
          timing: {
            startTime: 0
          },
          headers,
          isAjax: true,
          body,
          frames: frames.slice(0, 1)
        });
        addOffset(event.offset, msg);
        this.messagePublisher.publishMessage(msg);
      });
    });
  }

  private after(event: IProxyEvent, requestEntry: IRequestCacheEntry) {
    const eventData: IResponseReceivedEvent = event.data;
    tryFindResourceTimingObject(event.data.id, this.initiatorRegExp, eventData.url, requestEntry.startTimeOffset, (timings: PerformanceResourceTiming) => {

      const offset = timings ? timings.startTime : requestEntry.startTimeOffset;
      // start here is relative to this http client request, so it is always 0
      const startTime = 0;
      // leave responseStart undefined if no timings instance since this is optional and we don't know accurate value
      const responseStart = timings && (timings.responseStart >= timings.startTime) ? (timings.responseStart - timings.startTime) : undefined;
      const responseEnd = timings ? (timings.responseEnd - timings.startTime) : (event.offset - requestEntry.startTimeOffset);

      const headers = parse(eventData.xhr.getAllResponseHeaders());
      // TODO: https://github.com/Glimpse/Glimpse.Node.Prototype/issues/307
      // Add support for base64 encoding non-text content by setting the encoding here
      this.createBodyProperty(headers, eventData.body, (body) => {
        const msg = this.messagePublisher.createMessage('data-http-response', {
          correlationId: eventData.id,
          url: eventData.url,
          headers,
          statusCode: eventData.statusCode,
          statusMessage: eventData.statusMessage,
          endTime: getDateTime(new Date(event.timeStamp)),
          duration: responseEnd,
          timing: {
            startTime: 0,
            responseEnd
          },
          body
        });

        if (responseStart !== undefined) {
          msg.payload.timing.responseStart = responseStart;
        }

        addOffset(offset, msg);
        this.messagePublisher.publishMessage(msg);
      });
    });
  }

  public numOutstandingRequests() {
    return Object.keys(this.requests).length;
  }

  public init(messagePublisher: IMessagePublisher) {
    this.messagePublisher = messagePublisher;

    tracing.on(EVENT_XHR_REQUEST_SENT, (event: IProxyEvent) => {
      this.requests[event.data.id] = {
        startTimeStamp: event.timeStamp,
        startTimeOffset: event.offset
      };
      this.before(event);
    });

    tracing.on(EVENT_XHR_RESPONSE_RECEIVED, (event: IProxyEvent) => {
      const requestEntry = this.requests[event.data.id];
      if (!requestEntry) {
        logger.error('Glimpse Internal Error: could not find associated master data, some inspection data will be lost.');
        return;
      }
      this.after(event, requestEntry);
      delete this.requests[event.data.id];
    });

    tracing.on(EVENT_XHR_ERROR, (data: IProxyEvent) => {
      delete this.requests[data.data.id];
    });

    tracing.on(EVENT_XHR_ABORT, (data: IProxyEvent) => {
      delete this.requests[data.data.id];
    });
  }
}



// WEBPACK FOOTER //
// ./src/inspectors/XHRInspector.ts