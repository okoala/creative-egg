'use strict';

import { IContextManager, IRunInContextCallback } from './IContextManager';
import { ContextManagerBase } from './ContextManagerBase';
import { IAsyncTrack, IAsyncTrackEvents, getAsyncTrack } from './../async-track/async-track';
import { createAsyncTrackError, createAsyncTrackWarning } from '../../common';

import * as http from 'http';

// tslint:disable-next-line:no-any
// const rawDebug = (<any>process)._rawDebug;

export class ContextManagerAsyncTrack extends ContextManagerBase implements IContextManager {

  private static GLIMPSE_NAMESPACE = 'GLIMPSE_NAMESPACE';
  private static GLIMPSE_CONTEXT = 'GLIMPSE_CONTEXT';

  public asyncTrack;

  public init(asyncTrack?: IAsyncTrack) {
    const self = this;
    super.init();
    if (!asyncTrack) {
      asyncTrack = getAsyncTrack();
    }
    this.asyncTrack = asyncTrack;
    const handler: IAsyncTrackEvents = {
      onAsyncTransition: function onAsyncTransition(parentId, id) {
        // rawDebug(`onAsyncTransition: parentId ${parentId}, id ${id}`);
        const context = self.currentContext();
        if (context) {
          return self.createAsyncState(context);
        } else {
          return undefined;
        }
      },

      onBeforeInvocation: function onBeforeInvocation(id) {
        // rawDebug(`onBeforeInvocation:  id ${id}`);
      },

      onAfterInvocation: function onAfterInvocation(id) {
        // rawDebug(`onAfterInvocation:  id ${id}`);
      },

      onError: function onError(msg: string) {
        if (this.getErrorReportingService()) {
          this.getErrorReportingService().reportError(createAsyncTrackError(msg));
        }
      },

      onWarning: function onWarning(msg: string) {
        if (this.errorReportingService) {
          this.getErrorReportingService().reportError(createAsyncTrackWarning(msg));
        }
      },

    };
    this.asyncTrack.addHandler(handler);
  }

  public createAsyncState(context) {
    return {
      GLIMPSE_NAMESPACE: {
        GLIMPSE_CONTEXT: context,
      },
    };
  }

  // tslint:disable-next-line:no-any
  public runInNewContext(req: http.IncomingMessage, callback: IRunInContextCallback): any {
    const context = this.createContext(req);
    const callbackWrapper = function callbackWrapper() {
      return callback(context);
    };
    return this.asyncTrack.runInContext(callbackWrapper, this.createAsyncState(context));
  }

  // tslint:disable-next-line:no-any
  public runInNullContext(callback: IRunInContextCallback): any {
    const context = undefined;
    const callbackWrapper = function callbackWrapper() {
      return callback(context);
    };
    return this.asyncTrack.runInContext(callbackWrapper, this.createAsyncState(undefined));
  }

  public wrapInCurrentContext(callback: IRunInContextCallback) {
    const self = this;
    const asyncContext = this.asyncTrack.getCurrentContext();
    const wrapper = function wrapper() {
      const outerArgs = arguments;
      const outerThis = this;
      const callbackWrapper = function callbackWrapper() {
        callback.apply(outerThis, outerArgs);
      };
      return self.asyncTrack.runInContext(callbackWrapper, asyncContext);
    };
    return wrapper;
  }

  public currentContext() {
    const asyncContext = this.asyncTrack.getCurrentContext();
    let glimpseContext;
    if (asyncContext) {
      const glimpseNS = asyncContext[ContextManagerAsyncTrack.GLIMPSE_NAMESPACE];
      if (glimpseNS) {
        glimpseContext = glimpseNS[ContextManagerAsyncTrack.GLIMPSE_CONTEXT];
      }
    }
    return glimpseContext;
  }
}
