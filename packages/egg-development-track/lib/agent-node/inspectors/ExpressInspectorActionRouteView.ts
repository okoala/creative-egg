'use strict';

import { GuidHelper } from './../util/GuidHelper';
import { IAgentBroker } from '../messaging/IAgentBroker';
import { IContext, IContextManager } from '../messaging/IContextManager';
import { IDateTime } from '../configuration/IDateTime';
import { IErrorReportingService } from '../../common';
import { IScriptManager } from '../messaging/IScriptManager';
import { IWrappedMiddlewareFunction } from './util/MiddlewareWrapper';
import {
  EVENT_EXPRESS_INVOKE_PRE_ROUTE_DISPATCH,
  EVENT_EXPRESS_INVOKE_PRE_VIEW_RENDER,
  EVENT_EXPRESS_INVOKE_PRE_RESPONSE_RENDER,
  EVENT_EXPRESS_INVOKE_PRE_RESPONSE_SEND,
  EVENT_EXPRESS_INVOKE_PRE_RESPONSE_END,
  EVENT_EXPRESS_NOTIFY_RENDER_COMPLETE,
} from './../tracing/module_instrumentors/ExpressEvents';
import { HttpHelper } from '../util/HttpHelper';
import Tracing from './../tracing/Tracing';

import * as path from 'path';

interface IExtendedContext extends IContext {
  action?;
}

export class ExpressInspectorActionRouteView {

  private broker: IAgentBroker;
  private contextManager: IContextManager;
  private dateTime: IDateTime;
  private errorReportingService: IErrorReportingService;
  private scriptManager: IScriptManager;

  public init(
    broker: IAgentBroker,
    contextManager: IContextManager,
    dateTime: IDateTime,
    errorReportingService: IErrorReportingService,
    scriptManager: IScriptManager,
  ) {
    this.broker = broker;
    this.contextManager = contextManager;
    this.dateTime = dateTime;
    this.errorReportingService = errorReportingService;
    this.scriptManager = scriptManager;

    Tracing.onAlways(EVENT_EXPRESS_INVOKE_PRE_ROUTE_DISPATCH, (event) => {
      if (!HttpHelper.isInProcessServerResponse(event.data.response)) {
        this.onRouteDispatch(event.data.originalThis, event.data.response);
      }
    });

    Tracing.onAlways(EVENT_EXPRESS_INVOKE_PRE_RESPONSE_RENDER, (event) => {
      // TODO: https://github.com/Glimpse/Glimpse.Node/issues/320 - test missing
      if (!HttpHelper.isInProcessServerResponse(event.data.response)) {
        this.onResponseRender(event.data.originalThis);
      }
    });

    Tracing.onAlways(EVENT_EXPRESS_INVOKE_PRE_RESPONSE_SEND, (event) => {
      // TODO: https://github.com/Glimpse/Glimpse.Node/issues/320 - test missing
      if (!HttpHelper.isInProcessServerResponse(event.data.response)) {
        this.onResponseSend(event.data.originalThis, event.data.originalArgs);
      }
    });

    Tracing.onAlways(EVENT_EXPRESS_INVOKE_PRE_RESPONSE_END, (event) => {
      // TODO: https://github.com/Glimpse/Glimpse.Node/issues/320 - test missing
      if (!HttpHelper.isInProcessServerResponse(event.data.response)) {
        this.onResponseEnd(event.data.originalThis);
      }
    });

    Tracing.onAlways(EVENT_EXPRESS_NOTIFY_RENDER_COMPLETE, (event) => {
      if (!HttpHelper.isInProcessServerResponse(event.data.response)) {
        if (event.data.err) {
          this.onRenderCompleteError(event.data.err, event.data.response);
        } else {
          // TODO: https://github.com/Glimpse/Glimpse.Node/issues/320 - test missing
          this.onRenderComplete(event.data.response);
        }
      }
    });

    Tracing.onAlways(EVENT_EXPRESS_INVOKE_PRE_VIEW_RENDER, (event) => {
      this.onViewRender(event.data.originalThis);
    });
  }

  private onRouteDispatch(route, response) {
    const context = HttpHelper.getContext(response);
    this.contextManager.checkContextID(
      'ExpressInspectorActionRouteView::onRouteDispatch()', context ? context.id : undefined,
    );
    // TODO: figure out what correct data to display here for a "route" and an "action"

    const middlewareFunction: IWrappedMiddlewareFunction = route.stack[0].handle;
    let functionName;

    if (middlewareFunction.glimpse) {
      functionName = middlewareFunction.glimpse.originalName || '<anonymous>';
    } else {
      functionName = middlewareFunction.name || '<anonymous>';
    }

    const actionId = GuidHelper.newGuid();
    const actionName = functionName;
    const actionDisplayName = functionName;
    // const actionControllerName = functionName;
    const actionStartTime = new Date();

    this.broker.createAndSendMessage(
      {
        actionId,
        actionName,
        actionDisplayName,
        actionControllerName: '', // actionControllerName,

        // 'begin-action', 'action-route'
        actionStartTime,
        routeName: functionName,
        routePattern: route.path,
        routeData:
        {
          controller: '', // actionControllerName,
          action: actionName,
        },

        // 'before-action-invoked', 'action-content'
        actionTargetClass: '',
        actionTargetMethod: '',
        actionInvokedStartTime: actionStartTime,

        /* tslint:disable no-null-keyword */
        binding: null,
        /* tslint:enable no-null-keyword */

      },
      ['begin-action', 'action-route', 'before-action-invoked', 'action-content'], undefined /*indices*/, context);

    // Save some action-related context for response rendering...

    const extendedContext: IExtendedContext = context as IExtendedContext;
    extendedContext.action = {
      actionId,
      actionName,
      actionControllerName: '', // actionControllerName,
      actionStartTime,
      beforeActionInvokedSent: true,
      afterActionInvokedSent: false,
    };
  }

  private onResponseEnd(response) {
    const context: IExtendedContext = HttpHelper.getContext(response);
    this.contextManager.checkContextID(
      'ExpressInspectorActionRouteView::onResponseEnd()',
      context ? context.id : undefined,
    );

    if (!context) {
      return;
    }

    const actionContext = context.action;
    // ensure that we send after-action-invoked if it hasn't already been sent.
    // TODO:  There's probably a better way to do this.
    if (actionContext && actionContext.beforeActionInvokedSent && !actionContext.afterActionInvokedSent) {
      const startTime = new Date();

      this.broker.createAndSendMessage(
        {
          actionId: actionContext.actionId,
          actionName: actionContext.actionName,
          actionControllerName: '', // actionContext.actionControllerName,

          // 'after-action-invoked'
          actionInvokedEndTime: startTime,
          actionInvokedDuration: startTime.getTime() - actionContext.actionStartTime.getTime(),
          actionInvokedOffset: actionContext.actionStartTime.getTime() - context.startTime.getUnixTimestamp(),
        },
        ['after-action-invoked'],
        undefined,
        context);

      actionContext.afterActionInvokedSent = true;
    }
  }

  private onRenderCompleteError(err, response) {
    const context: IExtendedContext = HttpHelper.getContext(response);
    this.contextManager.checkContextID(
      'ExpressInspectorActionRouteView::onRenderCompleteError()',
      context ? context.id : undefined,
    );

    if (!context) {
      return;
    }

    const actionContext = context.action;
    if (!actionContext) {
      return;
    }

    if (err.view) {
      let viewPath = err.view.path;
      if (!viewPath) {
        viewPath = path.join(err.view.root, err.view.name) + err.view.ext;
      }
      const viewFound = err.view.path ? true : false;
      this.sendActionViewFound(err.view.name, viewPath, viewFound, context);
    }
  }

  private onRenderComplete(response) {
    const context: IExtendedContext = HttpHelper.getContext(response);
    this.contextManager.checkContextID(
      'ExpressInspectorActionRouteView::onRenderComplete()', context ? context.id : undefined,
    );
    if (!context) {
      return;
    }

    const actionContext = context.action;
    if (!actionContext) {
      return;
    }

    const startTime = actionContext.responseRenderStartTime;
    const endTime = new Date();

    this.broker.createAndSendMessage(
      {
        actionId: actionContext.actionId,
        actionName: actionContext.actionName,
        actionControllerName: '', // actionContext.actionControllerName,

        // 'after-action-view-invoked'
        viewEndTime: endTime,
        viewDuration: endTime.getTime() - startTime.getTime(),
        viewOffset: startTime.getTime() - context.startTime.getUnixTimestamp(),

        // 'after-action'
        actionEndTime: endTime,
        actionDuration: endTime.getTime() - actionContext.actionStartTime.getTime(),
        actionOffset: actionContext.actionStartTime.getTime() - context.startTime.getUnixTimestamp(),
      },
      ['after-action-view-invoked', 'after-action'],
      undefined,
      context);
  }

  private onResponseRender(response) {
    const context: IExtendedContext = HttpHelper.getContext(response);
    this.contextManager.checkContextID(
      'ExpressInspectorActionRouteView::onResponseRender()',
      context ? context.id : undefined,
    );
    if (!context) {
      return;
    }

    const actionContext = context.action;
    if (!actionContext) {
      return;
    }

    const startTime = new Date();
    actionContext.responseRenderStartTime = startTime;

    this.broker.createAndSendMessage(
      {
        actionId: actionContext.actionId,
        actionName: actionContext.actionName,
        actionControllerName: '', // actionContext.actionControllerName,

        // 'after-action-invoked'
        actionInvokedEndTime: startTime,
        actionInvokedDuration: startTime.getTime() - actionContext.actionStartTime.getTime(),
        actionInvokedOffset: actionContext.actionStartTime.getTime() - context.startTime.getUnixTimestamp(),

        // 'before-action-view-invoked'
        viewStartTime: startTime,
      },
      ['after-action-invoked', 'before-action-view-invoked'],
      undefined,
      context);

    actionContext.afterActionInvokedSent = true;
  }

  private onViewRender(view) {
    const context: IContext = this.contextManager.currentContext();
    this.contextManager.checkContextID(
      'ExpressInspectorActionRouteView::onViewRender()',
      context ? context.id : undefined,
    );

    const viewPath = view.path || path.join(view.root, view.name) + view.ext;
    const foundView = view.path ? true : false;
    this.sendActionViewFound(view.name, viewPath, foundView, context);
  }

  private onResponseSend(response, originalArgs) {
    const context: IContext = HttpHelper.getContext(response);
    this.contextManager.checkContextID(
      'ExpressInspectorActionRouteView::onResponseSend()',
      context ? context.id : undefined,
    );

    let position = 0;
    if (originalArgs.length === 2 && typeof originalArgs[0] === 'number' && typeof originalArgs[1] !== 'number') {
      position = 1;
    } else if (originalArgs.length === 1 && typeof originalArgs[0] === 'number') {
      position = -1;
    }

    // TODO: this should be an extension point
    if (position >= 0 && typeof originalArgs[position] === 'string' && response.req.baseUrl !== '/glimpse') {
      const contentType = HttpHelper.parseContentType(response.get('Content-Type'));
      if (
        (contentType.type === 'text' && contentType.subtype === 'html') ||
        (contentType.type === '' && contentType.subtype === '')
      ) {
        const scripts = this.scriptManager.getScriptTagsForCurrentRequest(context);
        let body = originalArgs[position];
        body = this.scriptManager.injectScript(body, scripts);
        originalArgs[position] = body;
      }
    }
  }

  private sendActionViewFound(viewName: string, viewPath: string, viewFound: boolean, context: IContext) {
    const viewSearchedTime = this.dateTime.now;
    this.broker.createAndSendMessage(
      {
        // 'action-view-found'
        viewName,
        viewPath,
        viewDidFind: viewFound,
        viewSearchedTime,
      },
      ['action-view-found'],
      undefined, /*indices*/
      context);
  }
}
