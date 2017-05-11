import logger from '../common/GlimpseLogger';
import { IInspector } from './IInspector';
import { IMessagePublisher } from '../MessagePublisher';
import { IProxyEvent } from '../tracing/IProxyEvent';
import { addOffset } from '../common/MessageMixins';
import {
  IRequestSentEvent, EVENT_FETCH_REQUEST_SENT,
  IResponseReceivedEvent, EVENT_FETCH_RESPONSE_RECEIVED,
  EVENT_FETCH_ERROR
} from '../tracing/proxies/FetchProxy';
import tracing from '../tracing/Tracing';
import { getDateTime } from '../common/DateTimeUtilities';
import { parseUrl, getHeaderKeys } from '../common/RequestUtilities';
import {
  tryFindResourceTimingObject,
  IBody,
  IPartSummary,
  getMultiPartFormBoundary,
  getMultiPartFormParts,
  createBodyForBlob,
  createEmptyBody
} from './HttpRequestUtils';
import { getStackTrace } from '../common/CallStackUtilities';

interface IRequestCacheEntry {
  startTimeStamp: number;
  startTimeOffset: number;
}

export class FetchInspector implements IInspector {

  private initiatorRexExp = /(^$)|(other)/i;

  private messagePublisher: IMessagePublisher;

  private requests: { [id: string]: IRequestCacheEntry } = {};

  private createHeaders(headers: Headers): { [header: string]: string } {
    const parsedHeaders = {};
    const headerKeys = getHeaderKeys(headers);
    for (const header of headerKeys) {
      parsedHeaders[header] = headers.get(header);
    }
    return parsedHeaders;
  }

  private getContentTypeHeader(headers: Headers): string {
    let val: string;
    val = headers.get('content-type');
    if (!val) {
      const headerKeys = getHeaderKeys(headers);
      for (const header of headerKeys) {
        if (header.toLowerCase() === 'content-type') {
          val = headers[header];
          break;
        }
      }
    }
    return val;
  }

  private before(event: IProxyEvent) {
    const eventData: IRequestSentEvent = event.data;

    getStackTrace((frames) => {
      const publishMessage = (body: IBody) => {
        const url = parseUrl(eventData.request.url);
        const startTime = getDateTime(new Date(event.timeStamp));
        const msg = this.messagePublisher.createMessage(['data-http-request', 'call-stack'], {
          correlationId: eventData.id,
          protocol: {
            identifier: url.protocol.replace(/\:$/, '').toLowerCase()
          },
          url: eventData.request.url,
          method: eventData.request.method,
          startTime,
          timing: {
            startTime: 0
          },
          headers: this.createHeaders(eventData.request.headers),
          isAjax: true,
          body,
          frames: frames.slice(0, 1)
        });
        addOffset(event.offset, msg);
        this.messagePublisher.publishMessage(msg);
      };

      eventData.request
        .blob()
        .then(
        blob => {
          const contentTypeHeader = this.getContentTypeHeader(eventData.request.headers);
          createBodyForBlob(contentTypeHeader, blob, true, body => {
            publishMessage(body);
          });
        },
        reason => {
          // Safari 10.1 fails to obtain the request body as a blob, so publish the message with a "truncated" body...
          // (https://github.com/Glimpse/Glimpse.Browser.Agent/issues/192)
          publishMessage(createEmptyBody(/* truncated: */ true));
        });
    });
  }

  private after(event: IProxyEvent, requestEntry: IRequestCacheEntry) {
    const eventData: IResponseReceivedEvent = event.data;
    eventData.response.blob().then((blob) => {
      const responseEndOffset = performance.now();

      // for fetch events, the initiator type is an empty string on chrome, and 'other' on firefox.

      tryFindResourceTimingObject(event.data.id, this.initiatorRexExp, event.data.response.url, requestEntry.startTimeOffset, (timings: PerformanceResourceTiming) => {

        // we make a best-effort to find the PerformanceResourceTiming instance associated with this request.  If we have one,
        // we use it, but if not, we fall back to using times associated with when different proxy methods were invoked
        const offset = timings ? timings.startTime : requestEntry.startTimeOffset;
        const startTime = 0;
        // leave responseStart undefined if no timings instance since this is optional and we don't know accurate value
        const responseStart = timings && (timings.responseStart >= timings.startTime) ? (timings.responseStart - timings.startTime) : undefined;
        const responseEnd = timings ? (timings.responseEnd - timings.startTime) : (responseEndOffset - requestEntry.startTimeOffset);

        const contentTypeHeader = this.getContentTypeHeader(eventData.response.headers);
        createBodyForBlob(contentTypeHeader, blob, true, (body) => {
          let statusCode: number;
          switch (eventData.response.type) {
            case 'error':
              // TODO: publish an error message here. See https://github.com/Glimpse/Glimpse.Browser.Agent/issues/134
              return;
            case 'opaque':
              statusCode = -1;
              break;
            case 'opaqueredirect':
              statusCode = -2;
              break;
            default:
              statusCode = eventData.response.status;
              break;
          }

          const msg = this.messagePublisher.createMessage('data-http-response', {
            correlationId: eventData.id,
            url: eventData.response.url,
            headers: this.createHeaders(eventData.response.headers),
            statusCode,
            statusMessage: eventData.response.statusText,
            endTime: getDateTime(new Date(event.timeStamp)),
            duration: responseEnd,
            timing: {
              startTime,
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
    });
  }

  public numOutstandingRequests() {
    return Object.keys(this.requests).length;
  }

  public init(messagePublisher: IMessagePublisher) {
    this.messagePublisher = messagePublisher;

    tracing.on(EVENT_FETCH_REQUEST_SENT, (event: IProxyEvent) => {
      this.requests[event.data.id] = {
        startTimeStamp: event.timeStamp,
        startTimeOffset: event.offset
      };
      this.before(event);
    });

    tracing.on(EVENT_FETCH_RESPONSE_RECEIVED, (event: IProxyEvent) => {
      const requestEntry = this.requests[event.data.id];
      if (!requestEntry) {
        logger.error('Glimpse Internal Error: could not find associated master data, some inspection data will be lost.');
        return;
      }
      this.after(event, requestEntry);
      delete this.requests[event.data.id];
    });

    tracing.on(EVENT_FETCH_ERROR, (data: IProxyEvent) => {
      delete this.requests[data.data.id];
    });
  }
}



// WEBPACK FOOTER //
// ./src/inspectors/FetchInspector.ts