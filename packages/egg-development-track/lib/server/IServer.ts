import { IMessagePublisher } from './messaging/IMessagePublisher';
import { IMessageQuery } from './storage/IMessageQuery';
import { IResourceAuthorization } from './resources/IResourceAuthorization';
import { IResourceManager } from './resources/IResourceManager';
import { IVersionInfoService } from './version/IVersionInfoService';

import { IConfigSettings, ITelemetryService, IErrorReportingService } from '@glimpse/glimpse-common';

export interface IProviders {
    messageQuery: IMessageQuery;
    messagePublisher: IMessagePublisher;
    resourceAuthorization: IResourceAuthorization;
    resourceManager: IResourceManager;
    resourceProvider: Object;
    configSettings: IConfigSettings;
    telemetryService: ITelemetryService;
    errorReportingService: IErrorReportingService;
    versionInfoService: IVersionInfoService;
}

export interface IServer {
    providers: IProviders;
}
