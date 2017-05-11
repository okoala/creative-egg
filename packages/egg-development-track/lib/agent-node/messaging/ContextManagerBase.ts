'use strict';

import * as http from 'http';
import { IContext, IRunInContextCallback, IContextManager } from './IContextManager';
import { GuidHelper } from './../util/GuidHelper';
import { IErrorReportingService, createNoContextError, createUnexpectedContextError } from '@glimpse/glimpse-common';
import { IAgentProviders } from './../IAgent';
import { IDateTime } from './../configuration/IDateTime';

export class ContextManagerBase implements IContextManager {

    private errorReportingService: IErrorReportingService;
    private dateTimeService: IDateTime;

    public init(): void {
        //no-op
    }

    public createContext(req: http.IncomingMessage): IContext {
        const context = {
            id: GuidHelper.newGuid(false),
            type: 'Request',
            startTime: this.dateTimeService.now,
            req: req
        };

        return context;
    };

    public isWithinContext(): boolean {
        return (this.currentContext() ? true : false);
    }

    public currentContext(): IContext {
        throw new Error('please override');
    }

    public runInNewContext(req: http.IncomingMessage, callback: IRunInContextCallback) {
        throw new Error('please override');
    }

    public runInNullContext(callback: IRunInContextCallback) {
        throw new Error('please override');
    }

    public wrapInCurrentContext(callback: IRunInContextCallback) {
        return callback;
    }

    public checkContextID(location: string, expectedContextID?: string) {
        const currentContext = this.currentContext();
        if (expectedContextID) {
            const currentContextID = currentContext ? currentContext.id : undefined;
            if (currentContextID !== expectedContextID) {
                if (this.errorReportingService) {
                    this.errorReportingService.reportError(createUnexpectedContextError(), location, expectedContextID, currentContextID);
                }
            }
        }
        else if (!currentContext) {
            if (this.errorReportingService) {
                this.errorReportingService.reportError(createNoContextError(), location);
            }
        }
    }

    public setServices(service: IAgentProviders) {
        this.errorReportingService = service.errorReportingService;
        this.dateTimeService = service.dateTime;
    }

    public getErrorReportingService(): IErrorReportingService {
        return this.errorReportingService;
    }
}
