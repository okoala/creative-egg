'use strict';

import { DateTimeValue } from '../configuration/DateTimeValue';
import { IAgent } from '../IAgent';
import { IDateTime } from '../configuration/IDateTime';
import { IServerRequestInspector, IPartSummary } from './IServerRequestInspector';
import { RequestHelper, HttpHelper } from '../util/HttpHelper';
import { ResponseListener } from './util/ResponseListener';
import { IMessage } from '../messaging/IMessage';

import * as http from 'http';

class InspectorResponseContext {
  public webResponseMessage: IMessage<{}>;

  public constructor(
    public startTime: DateTimeValue,
    public responseListener: ResponseListener,
    public webRequestMessage: IMessage<{}>,
  ) { }

}

interface IServerResponse extends http.ServerResponse {
  __requestInspectorContext: InspectorResponseContext;
}

export class WebInspector implements IServerRequestInspector {
  private agent: IAgent;
  private dateTime: IDateTime;

  public requestStart(req: http.IncomingMessage, res: http.ServerResponse, requestStartTime) {

    const inspectedResponse = res as IServerResponse;

    const context = HttpHelper.getContext(req);
    if (context) {

      // NOTE: We can't rely on req.statusCode during the request end event,
      //       as it may not be consistent with the headers actually sent.
      //       Instead, we track status code changes up to the point where
      //       headers are sent.

      const responseListener = ResponseListener.attachListener(res);

      const types = ['web-request'];

      // create the message envelope now so the offset value & the ordinal will reflect the start of request
      const message = this.agent.providers.messageConverter.createMessageEnvelope(types, undefined, context);
      inspectedResponse.__requestInspectorContext =
        new InspectorResponseContext(requestStartTime, responseListener, message);
    }
  }

  /* tslint:disable:no-any */
  public requestEnd(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    content: any[],
    size: number,
    requestStartTime: DateTimeValue,
    multiPartSummaries?: IPartSummary[],
  ) {
    /* tslint:enable:no-any */

    const requestEndTime = this.getCurrentTimeStamp();

    // pull context from request instead of context manager, as request/response is more reliable
    const context = HttpHelper.getContext(req);
    if (context) {
      const inspectedResponse = res as IServerResponse;
      const message = inspectedResponse.__requestInspectorContext.webRequestMessage;

      const data = {
        url: this.getRequestUrl(req),
        method: req.method,
        startTime: requestStartTime.format(),
        protocol: {
          identifier: RequestHelper.protocol(req),
          version: req.httpVersion,
        },
        headers: req.headers,
        isAjax: RequestHelper.header(req, 'X-Glimpse-IsAjax') === 'true',
        clientIp: req.socket.remoteAddress,
        body: HttpHelper.createMessageBodyProperty(
          req, content, size, this.agent.providers.configSettings, multiPartSummaries,
        ),
        timing: {
          requestStart: requestStartTime.diff(context.startTime),
          requestEnd: requestEndTime.diff(context.startTime),
        },
      };

      // update indices
      message.indices = {
        'request-url': data.url,
        'request-method': data.method,
        'request-datetime': data.startTime,
      };

      const transmittableMessage = this.agent.providers.messageConverter.transformMessageForTransit(message, data);
      this.agent.broker.sendMessage(transmittableMessage);
    }
  }

  public responseStart(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    responseStartTime: DateTimeValue,
  ) {
    const inspectedResponse = res as IServerResponse;

    const context = HttpHelper.getContext(req);
    if (context) {
      const types = ['web-response'];

      // create the message envelope now so the offset value & the ordinal will reflect the start of response
      const message = this.agent.providers.messageConverter.createMessageEnvelope(types, undefined, context);
      inspectedResponse.__requestInspectorContext.webResponseMessage = message;
    }
  }

  // tslint:disable-next-line:no-any
  public responseEnd(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    content: any[],
    size: number,
    responseStartTime: DateTimeValue,
  ) {

    // pull context from request instead of context manager, as request/response is more reliable
    const context = HttpHelper.getContext(req);
    if (context) {
      const inspectedResponse = res as IServerResponse;

      const endTime = this.dateTime.now;

      const data = {
        url: this.getRequestUrl(req),
        headers: ResponseListener.getAllHeaders(res),
        statusCode: inspectedResponse.__requestInspectorContext.responseListener.sentStatusCode,
        statusMessage: inspectedResponse.__requestInspectorContext.responseListener.sentStatusMessage,
        duration: endTime.diff(inspectedResponse.__requestInspectorContext.startTime),
        endTime: endTime.format(),
        body: HttpHelper.createMessageBodyProperty(res, content, size, this.agent.providers.configSettings),
        timing: {
          responseStart: responseStartTime.diff(context.startTime),
          responseEnd: endTime.diff(context.startTime),
        },
      };

      const indices = {
        'request-duration': data.duration,
        'request-status-code': data.statusCode,
      };

      const contentType = data.headers['content-type'];

      if (contentType && contentType.length > 0) {
        indices['request-content-type'] = contentType[0];
      }

      let message = inspectedResponse.__requestInspectorContext.webResponseMessage;
      if (!message) {
        message = this.agent.providers.messageConverter.createMessageEnvelope(['web-response'], undefined, context);
      }
      message.indices = indices;

      const transmittableMessage = this.agent.providers.messageConverter.transformMessageForTransit(message, data);
      this.agent.broker.sendMessage(transmittableMessage);
    }
  }

  public init(agent: IAgent) {
    this.agent = agent;
    this.dateTime = agent.providers.dateTime;
  }

  private getCurrentTimeStamp(): DateTimeValue {
    return DateTimeValue.fromUnixMillisecondTimestamp(Date.now(), process.hrtime());
  }

  private getRequestUrl(req: http.IncomingMessage): string {
    let requestUrl = req.url;

    // Check if this is an express request object, which splits the path into baseUrl and url
    // tslint:disable:no-any
    if (req.hasOwnProperty('baseUrl') && typeof (req as any).baseUrl === 'string') {
      requestUrl = (req as any).baseUrl + req.url;
    }
    // tslint:enable:no-any

    // Create the full URL, if we can
    const host = RequestHelper.host(req);
    const protocol = RequestHelper.protocol(req);
    if (host && protocol) {
      return `${protocol}://${host}${requestUrl}`;
    } else {
      return requestUrl;
    }
  }
}
