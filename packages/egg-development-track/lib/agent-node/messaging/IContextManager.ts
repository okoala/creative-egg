'use strict';

import * as http from 'http';
import { DateTimeValue } from './../configuration/DateTimeValue';
import { IAgentProviders } from './../IAgent';
import { IErrorReportingService } from '../../common';

export interface IRunInContextCallback {
  (context: IContext);
}

export interface IWrappedCallback {
  /*tslint:disable:no-any */
  (...params): any;
  /*tslint:disable:no-any */
}

export interface IContext {
  id: string;
  type: string;
  startTime: DateTimeValue;
  req: http.IncomingMessage;
}

export interface IContextManager {
  currentContext(): IContext;
  isWithinContext(): boolean;
  runInNewContext(req: http.IncomingMessage, callback: IRunInContextCallback);
  runInNullContext(callback: IRunInContextCallback);
  wrapInCurrentContext(callback: IWrappedCallback): IWrappedCallback;
  checkContextID(location: string, expectedContextID?: string);
  setServices(services: IAgentProviders);
  getErrorReportingService(): IErrorReportingService;
}
