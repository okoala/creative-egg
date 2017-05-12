'use strict';

import {
  EVENT_EXPRESS_INVOKE_PRE_ROUTE_DISPATCH,
  EVENT_EXPRESS_INVOKE_PRE_VIEW_RENDER,
  EVENT_EXPRESS_INVOKE_PRE_RESPONSE_RENDER,
  EVENT_EXPRESS_INVOKE_PRE_RESPONSE_SEND,
  EVENT_EXPRESS_INVOKE_PRE_RESPONSE_END,
  EVENT_EXPRESS_NOTIFY_RENDER_COMPLETE,
} from './ExpressEvents';
import Tracing from './../Tracing';

export class ExpressProxyActionRouteView {

  public static init(express) {

    const expressDispatch = express.Route.prototype.dispatch;
    express.Route.prototype.dispatch = function dispatchRoute(req, res, ...rest) {

      if (Tracing.isEventEnabled(EVENT_EXPRESS_INVOKE_PRE_ROUTE_DISPATCH)) {
        const data = {
          originalThis: this,
          originalArgs: arguments,
          response: res,
        };
        Tracing.publish(EVENT_EXPRESS_INVOKE_PRE_ROUTE_DISPATCH, data);
      }

      return expressDispatch.call(this, req, res, ...rest);
    };

    const expressResponseRender = express.response.render;
    express.response.render = function renderResponse(...rest) {
      // Need to pass original arguments
      const updatedArguments = ExpressProxyActionRouteView.fixupResponseRenderArgs(this, rest);
      const response = this;

      // hijack the view render here - A "view engine" is pluggable on the app, so we want to support
      // potential of multiple apps in a process with different "view" settings.
      if (!this.req.app.settings.view.prototype.originalRender) {
        this.req.app.settings.view.prototype.originalRender = this.req.app.settings.view.prototype.render;
        this.req.app.settings.view.prototype.render = function viewRender() {
          if (Tracing.isEventEnabled(EVENT_EXPRESS_INVOKE_PRE_VIEW_RENDER)) {
            // NOTE:  be careful of any closure variables used here, as they'll always reflect the first
            // time through the parent function, since we only set up this proxy once.
            const data = {
              originalThis: this,
              originalArgs: arguments,
            };
            Tracing.publish(EVENT_EXPRESS_INVOKE_PRE_VIEW_RENDER, data);
          }
          const expressViewRender = this.originalRender;
          return expressViewRender.apply(this, arguments);
        };
      }

      if (Tracing.isEventEnabled(EVENT_EXPRESS_INVOKE_PRE_RESPONSE_RENDER)) {
        const data = {
          originalThis: this,
          originalArgs: updatedArguments,
          response,
        };
        Tracing.publish(EVENT_EXPRESS_INVOKE_PRE_RESPONSE_RENDER, data);
      }

      return expressResponseRender.apply(this, updatedArguments);
    };

    const expressSend = express.response.send;
    express.response.send = function sendResponse() {
      if (Tracing.isEventEnabled(EVENT_EXPRESS_INVOKE_PRE_RESPONSE_SEND)) {
        const data = {
          originalThis: this,
          originalArgs: arguments,
          response: this,
        };
        Tracing.publish(EVENT_EXPRESS_INVOKE_PRE_RESPONSE_SEND, data);
      }

      return expressSend.apply(this, arguments);
    };

    const expressEnd = express.response.end;
    express.response.end = function endResponse() {

      if (Tracing.isEventEnabled(EVENT_EXPRESS_INVOKE_PRE_RESPONSE_END)) {
        const data = {
          originalThis: this,
          originalArgs: arguments,
          response: this,
        };
        Tracing.publish(EVENT_EXPRESS_INVOKE_PRE_RESPONSE_END, data);
      }

      return expressEnd.apply(this, arguments);
    };
  }

  private static fixupResponseRenderArgs(response, originalArguments) {
    let done;

    function onRenderComplete(err, str) {

      if (Tracing.isEventEnabled(EVENT_EXPRESS_NOTIFY_RENDER_COMPLETE)) {
        const data = {
          originalThis: this,
          originalArgs: arguments,
          err,
          response,
        };
        Tracing.publish(EVENT_EXPRESS_NOTIFY_RENDER_COMPLETE, data);
      }

      done(err, str);
    }

    const updatedArguments = Array.prototype.slice.call(originalArguments);

    if (updatedArguments.length > 0 && (typeof updatedArguments[updatedArguments.length - 1] === 'function')) {
      done = updatedArguments[updatedArguments.length - 1];
      updatedArguments[updatedArguments.length - 1] = onRenderComplete;
    } else {
      updatedArguments.push(onRenderComplete);
    }

    // default callback - this is the default "done" handler set up by express response object.
    // It ensures we have correct error handling.
    done = done || function callback(err, str) {
      if (err) {
        return response.req.next(err);
      }
      response.send(str);
    };

    return updatedArguments;
  }
}
