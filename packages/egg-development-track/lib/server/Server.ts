'use strict';

import { IServer } from './IServer';

import { MessagePublisher } from './messaging/MessagePublisher';
import { InMemoryMessageQuery } from './storage/InMemoryMessageQuery';
import { InMemoryMessageStorage } from './storage/InMemoryMessageStorage';
import { IResourceFactory } from './resources/IResourceFactory';
import { ResourceAuthorization } from './resources/ResourceAuthorization';
import { ResourceManager } from './resources/ResourceManager';
import { IVersionInfoService } from './version/IVersionInfoService';
import { VersionInfoService } from './version/VersionInfoService';

import { IConfigSettings, ConfigSettings } from '@glimpse/glimpse-common';
import { getTelemetryConfig, ITelemetryService, TelemetryService, GlimpseComponentType, IProperties, IMeasurements, getTelemetryAppInstanceData, TelemetryEvents } from '@glimpse/glimpse-common';
import { IErrorReportingService, CompositeErrorReportingService, TelemetryErrorReportingService, LoggingErrorReportingService, PackageHelper } from '@glimpse/glimpse-common';

import path = require('path');

const resources = [
    'Context',
    'ExportConfig',
    'MessageDebug',
    'MessageHistory',
    'MessageIngress',
    'MessageStream',
    'Metadata',
    'RequestHistory',
    'TelemetryConfig',
    'AgentEmbedded',
    'HudEmbedded',
    'ClientEmbeddedDefault',
    'ClientEmbeddedDev',
    'ClientEmbeddedProd'
];

export class Server implements IServer {

    public providers;

    private _messageStorage = new InMemoryMessageStorage();
    private _messagePublisher = new MessagePublisher(this._messageStorage);
    private _messageQuery = new InMemoryMessageQuery(this._messageStorage);
    private _resourceAuthorization = new ResourceAuthorization();
    private _resourceManager = new ResourceManager();
    private _configSettings: IConfigSettings;
    private _telemetryService: ITelemetryService;
    private _errorReportingService: IErrorReportingService;
    private _versionInfoService: IVersionInfoService;

    public constructor() {
        const localSettingsFile = ConfigSettings.findFile(__dirname, 'glimpse.config.json');
        const defaultSettings = path.join(__dirname, 'glimpse.server.default.config.json');
        const commandLineArgs = ConfigSettings.filterCommandLineArgs('--GLIMPSE_');
        this._configSettings = new ConfigSettings(commandLineArgs, 'GLIMPSE_', localSettingsFile, defaultSettings);
        const telemetryConfig = getTelemetryConfig(this._configSettings);
        this._telemetryService = new TelemetryService(GlimpseComponentType.NODE_SERVER, telemetryConfig);
        this._errorReportingService = new CompositeErrorReportingService([new LoggingErrorReportingService(), new TelemetryErrorReportingService(this._telemetryService)]);
        this._versionInfoService = new VersionInfoService(PackageHelper.instance);

        this.providers = {
            messagePublisher: this._messagePublisher,
            messageQuery: this._messageQuery,
            resourceAuthorization: this._resourceAuthorization,
            resourceManager: this._resourceManager,
            telemetryService: this._telemetryService,
            configSettings: this._configSettings,
            errorReportingService: this._errorReportingService,
            versionInfoService: this._versionInfoService,

            // TODO: Set this properly once the resource provider has been converted to TypeScript.
            resourceProvider: undefined
        };
    }

    public init() {
        this.registerResources();

        this.sendServerInitEvent();
    }

    private registerResources() {
        for (let i = 0; i < resources.length; i++) {
            const resourceModule = require('./resources/' + resources[i] + 'Resource');
            const resourceFactory: IResourceFactory = resourceModule.Resource;
            const resource = new resourceFactory(this);

            this._resourceManager.register(resource);
        }
    }

    private sendServerInitEvent() {
        const props: IProperties = {};
        const appData = getTelemetryAppInstanceData(this._configSettings);
        for (let p in appData) {
            if (appData.hasOwnProperty(p)) {
                props[p] = appData[p];
            }
        }
        const measurements: IMeasurements = {};

        this._telemetryService.sendEvent(TelemetryEvents.NODE_SERVER_INIT, props, measurements);
    }
}

export var instance = new Server();
