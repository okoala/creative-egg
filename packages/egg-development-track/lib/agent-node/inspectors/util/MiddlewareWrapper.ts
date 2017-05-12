'use strict';

import { IAgentBroker } from '../../messaging/IAgentBroker';
import { IContext, IContextManager } from '../../messaging/IContextManager';
import { IDateTime } from '../../configuration/IDateTime';
import { ResponseListener } from './ResponseListener';
import { GuidHelper } from '../../util/GuidHelper';
import { HttpHelper } from '../../util/HttpHelper';
import { IStackHelper, IStackFrame } from './StackHelper';
import { IMessage } from '../../messaging/IMessage';
import { IMessageConverter } from '../../messaging/IMessageConverter';

import * as _ from 'lodash';
import * as http from 'http';

interface IEndFunction {
  ();
}

interface IMiddlewareContext {
  stack: IEndFunction[];
}

interface IExtendedContext extends IContext {
  middleware: IMiddlewareContext;
}

export interface IMiddlewareStartPayload {
  correlationId: string;
  name: string;
  displayName?: string;
  packageName?: string;
  paths?: string[];
  method?: string;
  params?: { [key: string]: string };
  startTime: string;
  frames: IStackFrame[];
}

export interface IMiddlewareHeaderOperation {
  op: string;
  name: string;
  value?: string[];
}

export interface IMiddlewareOperation {
  type: string;
}

export interface IResponseBodyOperation extends IMiddlewareOperation {
  // NOTE: Currently this operation type has no custom data.
}

export interface IResponseStatusCodeOperation extends IMiddlewareOperation {
  statusCode: number;
}

export interface IMiddlewareEndPayload {
  correlationId: string;
  name: string;
  displayName?: string;
  packageName?: string;
  paths?: string[];
  method?: string;
  params?: { [key: string]: string };
  endTime: string;
  duration: number;
  headers?: IMiddlewareHeaderOperation[];
  operations?: IMiddlewareOperation[];
  result: string;
}

export interface IMiddlewareNextCallback {
  (result?: string | Error);
}

export interface IMiddlewareMetadata {
  ignore?: boolean;
  name?: string;
  displayName?: string;
  packageName?: string;
}

export interface IMiddlewareFunction {
  (req?: http.IncomingMessage, res?: http.ServerResponse, next?: IMiddlewareNextCallback);

  name?: string;
  glimpse?: IMiddlewareMetadata;
}

export interface IMiddlewareErrorFunction {
  /* tslint:disable no-any */
  (err: any, req?: http.IncomingMessage, res?: http.ServerResponse, next?: IMiddlewareNextCallback);
  /* tslint:enable no-any */

  name?: string;
  glimpse?: IMiddlewareMetadata;
}

export interface IMiddlewareFunctionContext {
  originalName?: string;
}

export interface IWrappedMiddlewareFunction extends IMiddlewareFunction {
  glimpse?: IMiddlewareFunctionContext;
}

export interface IWrappedMiddlewareErrorFunction extends IMiddlewareErrorFunction {
  glimpse?: IMiddlewareFunctionContext;
}

export interface IExpressRequest extends http.IncomingMessage {
  params?: { [key: string]: string };
}

export class MiddlewareWrapper {

  constructor(
    private stackHelper: IStackHelper,
    private messageConverter: IMessageConverter,
    private broker: IAgentBroker,
    private contextManager: IContextManager,
    private dateTime: IDateTime,
  ) { }

  public static attachMetadata(
    middleware: IMiddlewareFunction,
    name: string,
    displayName: string,
    packageName: string,
  ): void {
    if (middleware) {
      const metadata: IMiddlewareMetadata = middleware.glimpse || {};

      if (!middleware.glimpse) {
        middleware.glimpse = metadata;
      }

      if (!metadata.name) {
        metadata.name = name;
      }

      if (!metadata.displayName) {
        metadata.displayName = displayName;
      }

      if (!metadata.packageName) {
        metadata.packageName = packageName;
      }
    }
  }

  public wrap(
    paths: string[],
    method: string,
    originalMiddleware: IMiddlewareFunction | IMiddlewareErrorFunction,
    registrationCallstack: IStackFrame[]
  ): IWrappedMiddlewareFunction | IWrappedMiddlewareErrorFunction {

    if (originalMiddleware && typeof originalMiddleware === 'function') {
      if (originalMiddleware.length === 2 || originalMiddleware.length === 3) {
        return this.wrapMiddleware(paths, method, originalMiddleware as IMiddlewareFunction, registrationCallstack);
      }

      if (originalMiddleware.length === 4) {
        return this.wrapErrorMiddleware(
          paths, method, originalMiddleware as IMiddlewareErrorFunction, registrationCallstack,
        );
      }
    }

    return originalMiddleware;
  }

  private mapFramesAndSendMessageAsync(message: IMessage<IMiddlewareStartPayload>) {
    if (message.payload.frames) {
      this.stackHelper.mapFrames(message.payload.frames, (mappedFrames) => {
        message.payload.frames = mappedFrames;
        const transformedMessage = this.messageConverter.transformMessageForTransit(message, message.payload);
        this.broker.sendMessage(transformedMessage);
      });
    } else {
      const transformedMessage = this.messageConverter.transformMessageForTransit(message, message.payload);
      this.broker.sendMessage(transformedMessage);
    }
  }

  private wrapCommonMiddleware(
    paths: string[],
    method: string,
    originalMiddlewareName: string,
    middlewareMetadata: IMiddlewareMetadata,
    req: IExpressRequest,
    res: http.ServerResponse,
    next: IMiddlewareNextCallback,
    originalMiddleware: IMiddlewareFunction,
    registrationCallstack: IStackFrame[]) {

    const self = this;

    const context: IExtendedContext = HttpHelper.getContext(res) as IExtendedContext;

    if (!context) {
      return originalMiddleware(req, res, next);
    }

    self.contextManager.checkContextID('MiddlewareWrapper::MiddlewareWrapper', context ? context.id : undefined);

    const correlationId = GuidHelper.newGuid();
    const startTime = self.dateTime.now;

    let name = originalMiddlewareName || '<anonymous>';
    let displayName;
    let packageName;

    if (middlewareMetadata) {
      name = middlewareMetadata.name || name;
      displayName = middlewareMetadata.displayName;
      packageName = middlewareMetadata.packageName;
    }

    const startPayload: IMiddlewareStartPayload = {
      correlationId,
      name,
      startTime: startTime.format(),
      frames: registrationCallstack,
    };

    if (displayName) {
      startPayload.displayName = displayName;
    }

    if (packageName) {
      startPayload.packageName = packageName;
    }

    if (paths && paths.length > 0) {
      startPayload.paths = paths;
    }

    if (method) {
      startPayload.method = method;
    }

    if (req.params && !_.isEmpty(req.params)) {
      startPayload.params = req.params;
    }

    const messageTypes = ['middleware-express', 'middleware-start', 'call-stack'];
    const message: IMessage<IMiddlewareStartPayload> =
      self.messageConverter.createMessageEnvelope<IMiddlewareStartPayload>(
        messageTypes, /*indices*/ undefined, context,
      );
    message.payload = startPayload;

    // send message asynchronously
    self.mapFramesAndSendMessageAsync(message);

    const headers: { [key: string]: string[] } = {};
    const operations: IMiddlewareOperation[] = [];

    let publishedEnd = false;

    function publishMiddlewareEnd(result) {
      // NOTE: To prevent the client from getting confused, we only ever publish a single "end" message.

      if (!publishedEnd) {
        const endTime = self.dateTime.now;
        const duration = endTime.diff(startTime);

        const endPayload: IMiddlewareEndPayload = {
          correlationId,
          name,
          endTime: endTime.format(),
          duration,
          result,
        };

        if (displayName) {
          endPayload.displayName = displayName;
        }

        if (packageName) {
          endPayload.packageName = packageName;
        }

        if (!_.isEmpty(headers)) {
          endPayload.headers = _.map(headers, (value, key) => {
            return {
              op: 'set',
              name: key,
              values: value,
            };
          });
        }

        if (operations.length) {
          endPayload.operations = operations;
        }

        if (paths && paths.length > 0) {
          endPayload.paths = paths;
        }

        if (method) {
          endPayload.method = method;
        }

        if (req.params && !_.isEmpty(req.params)) {
          endPayload.params = req.params;
        }

        self.broker.createAndSendMessage(
          endPayload,
          ['middleware-express', 'middleware-end'],
                    /* indices */ undefined,
          context);

        publishedEnd = true;
      }
    }

    function onPublishMiddlewareEnd() {
      publishMiddlewareEnd(/* result */ 'end');
    }

    if (!context.middleware) {
      context.middleware = {
        stack: [],
      };
    }

    context.middleware.stack.push(onPublishMiddlewareEnd);

    function onResponseFinish() {
      while (context.middleware.stack.length > 0) {
        const endFunction = context.middleware.stack.pop();

        endFunction();
      }
    }

    res.on('finish', onResponseFinish);

    function onBody() {
      const responseBody: IResponseBodyOperation = {
        type: 'responseBody',
      };

      operations.push(responseBody);
    }

    function onHeaders(newHeaders) {
      _.assign(headers, newHeaders);
    }

    function onStatusCodeSet(statusCode: number) {
      const responseStatusCode: IResponseStatusCodeOperation = {
        type: 'responseStatusCode',
        statusCode,
      };

      operations.push(responseStatusCode);
    }

    const responseListener = ResponseListener.attachListener(res);

    responseListener.on(ResponseListener.bodyEvent, onBody);
    responseListener.on(ResponseListener.headersEvent, onHeaders);
    responseListener.on(ResponseListener.statusCodeEvent, onStatusCodeSet);

    let cleanedUp = false;

    const cleanUpAndPublishEnd = (result: string) => {
      // NOTE: Certain error conditions can cause next() and/or exception handlers to be called again.

      if (!cleanedUp) {
        cleanedUp = true;

        res.removeListener('finish', onResponseFinish);

        responseListener.removeListener(ResponseListener.bodyEvent, onBody);
        responseListener.removeListener(ResponseListener.headersEvent, onHeaders);
        responseListener.removeListener(ResponseListener.statusCodeEvent, onStatusCodeSet);

        context.middleware.stack.pop();

        publishMiddlewareEnd(result);
      }
    };

    const newNext = self.contextManager.wrapInCurrentContext(function newNextInternal() {
      self.contextManager.checkContextID('MiddlewareWrapper::newNext', context.id);

      let result = 'next';

      if (arguments && arguments.length > 0 && arguments[0] !== 'route') {
        result = 'error';
      }

      cleanUpAndPublishEnd(result);

      return next.apply(this, arguments);
    });

    try {
      originalMiddleware(req, res, newNext);
    } catch (err) {
      cleanUpAndPublishEnd(/* result */ 'error');
      throw err;
    }
  }

  private wrapErrorMiddleware(
    paths: string[],
    method: string,
    originalMiddleware: IMiddlewareErrorFunction,
    registrationCallstack: IStackFrame[]): IWrappedMiddlewareErrorFunction {
    const self = this;
    const wrappedMiddleware = function wrappedMiddleware(err, req, res, next) {
      self.wrapCommonMiddleware(
        paths,
        method,
        originalMiddleware.name,
        originalMiddleware.glimpse,
        req,
        res,
        next,
        (q, r, n) => {
          originalMiddleware(err, q, r, n);
        },
        registrationCallstack);
    } as IWrappedMiddlewareErrorFunction;

    wrappedMiddleware.glimpse = {
      originalName: originalMiddleware.name,
    };

    return wrappedMiddleware;
  }

  private wrapMiddleware(
    paths: string[],
    method: string,
    originalMiddleware: IMiddlewareFunction,
    registrationCallstack: IStackFrame[]): IWrappedMiddlewareFunction {
    const self = this;
    const wrappedMiddleware = function wrappedMiddleware(req, res, next) {
      self.wrapCommonMiddleware(
        paths,
        method,
        originalMiddleware.name,
        originalMiddleware.glimpse,
        req,
        res,
        next,
        (q, r, n) => {
          originalMiddleware(q, r, n);
        },
        registrationCallstack);
    } as IWrappedMiddlewareFunction;

    wrappedMiddleware.glimpse = {
      originalName: originalMiddleware.name,
    };

    return wrappedMiddleware;
  }

}
