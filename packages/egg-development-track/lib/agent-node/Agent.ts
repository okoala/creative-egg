// load context manager first so we can avoid modules getting loaded
// before we have a chance to overwrite calls for async context tracking
import { ContextManagerProvider } from './messaging/ContextManagerProvider';
const cm = ContextManagerProvider.getContextManager();

import { AgentBroker } from './messaging/AgentBroker';
import { IAgent, IAgentProviders, IAgentOptions } from './IAgent';

import { DeferredInitializationManager } from './DeferredInitializationManager';
import { IAgentBroker } from './messaging/IAgentBroker';
import { MessageConverter } from './messaging/MessageConverter';
import { MessagePublisher } from './messaging/MessagePublisher';
import {
  createPackageRequiredBeforeInitError,
  ConfigSettings,
  LoggingErrorReportingService,
  TelemetryErrorReportingService,
  CompositeErrorReportingService,
  PackageHelper,
  printBannerGreeting,
  getTelemetryConfig,
  TelemetryService,
  ITelemetryService,
  TelemetryEvents,
  GlimpseComponentType,
  getTelemetryAppInstanceData,
  IMeasurements,
  IProperties,
} from '../common';

import { ModuleManager } from './tracing/ModuleManager';
import { ResourceProvider } from './configuration/ResourceProvider';
import { IStackHelper, StackHelper } from './inspectors/util/StackHelper';
import { NoContextTelemetryService } from './util/NoContextTelemetryService';

// instrumentors
import { ConsoleModuleInstrumentor } from './tracing/module_instrumentors/ConsoleModuleInstrumentor';
import { HttpModuleInstrumentor } from './tracing/module_instrumentors/HttpModuleInstrumentor';
import { ExpressModuleInstrumentor } from './tracing/module_instrumentors/ExpressModuleInstrumentor';
import { MongoDBModuleInstrumentor } from './tracing/module_instrumentors/MongoDBModuleInstrumentor';
import { MongoDBCoreModuleInstrumentor } from './tracing/module_instrumentors/MongoDBCoreModuleInstrumentor';
import { KnexModuleInstrumentor } from './tracing/module_instrumentors/KnexModuleInstrumentor';
import { MorganModuleInstrumentor } from './tracing/module_instrumentors/MorganModuleInstrumentor';
import { BodyParserModuleInstrumentor } from './tracing/module_instrumentors/BodyParserModuleInstrumentor';
import { CookieParserModuleInstrumentor } from './tracing/module_instrumentors/CookieParserModuleInstrumentor';

// inspectors
import { ExpressInspectorActionRouteView } from './inspectors/ExpressInspectorActionRouteView';
import { ExpressInspectorMiddleware } from './inspectors/ExpressInspectorMiddleware';
import { MongoDBInspector } from './inspectors/MongoDBInspector';
import { MongoDBCoreInspector } from './inspectors/MongoDBCoreInspector';
import { ClientRequestInspector } from './inspectors/ClientRequestInspector';

import { DateTime } from './configuration/DateTime';
import { ScriptManager } from './messaging/ScriptManager';
import { RequireAnalyzer } from './configuration/RequireAnalyzer';

import path = require('path');

export function createGlobalNodeAgent(): IAgent {
  if (isNodeAgentCreated()) {
    throw new Error('Glimpse Node Agent has already been created.  Only one is allowed per process.');
  } else {
    const agent = new Agent();
    // tslint:disable-next-line:no-any
    (global as any).__glimpse_node_agent = agent;
    return agent;
  }
}

export function isNodeAgentCreated(): boolean {
  // tslint:disable-next-line:no-any
  return !!(global as any).__node_agent;
}

class Agent implements IAgent {

  private _broker: IAgentBroker;
  private _contextManager = cm;
  private _errorReportingService;
  private _telemetryService: ITelemetryService;
  private _providers: IAgentProviders;
  private _resourceProvider: ResourceProvider = new ResourceProvider();
  private _messagePublisher: MessagePublisher = new MessagePublisher(this._resourceProvider);
  private _stackHelper: IStackHelper;

  constructor() {
    const commandLineArgs = ConfigSettings.filterCommandLineArgs('--GLIMPSE_');
    const localSettingsFile = ConfigSettings.findFile('./', 'glimpse.config.json');
    const defaultSettings = path.join(__dirname, 'agent.default.config.json');
    const configSettings = new ConfigSettings(commandLineArgs, 'GLIMPSE_', localSettingsFile, defaultSettings);
    const telemetryConfig = getTelemetryConfig(configSettings);
    this._telemetryService = new NoContextTelemetryService(
      new TelemetryService(GlimpseComponentType.NODE_AGENT, telemetryConfig)
    );
    this._errorReportingService = new CompositeErrorReportingService(
      [new LoggingErrorReportingService(), new TelemetryErrorReportingService(this._telemetryService)],
    );
    this._stackHelper = new StackHelper(this._errorReportingService);
    const dateTimeService = new DateTime();

    this._providers = {
      contextManager: this._contextManager,
      dateTime: dateTimeService,
      deferredInitializationManager: new DeferredInitializationManager(),
      errorReportingService: this._errorReportingService,
      messagePublisher: this._messagePublisher,
      resourceProvider: this._resourceProvider,
      scriptManager: new ScriptManager(this._contextManager, this._resourceProvider),
      configSettings,
      telemetryService: this._telemetryService,
      stackHelper: this._stackHelper,
      messageConverter: new MessageConverter(dateTimeService)
    };
    this._broker = new AgentBroker(this);

    this._contextManager.setServices(this._providers);
  }

  public get broker(): IAgentBroker {
    return this._broker;
  }

  public get providers(): IAgentProviders {
    return this._providers;
  }

  public init(options?: IAgentOptions) {

    this.validateReferencedPackages();

    // Initialize the inspectors
    new ExpressInspectorActionRouteView().init(
      this._broker,
      this._contextManager,
      this._providers.dateTime,
      this._providers.errorReportingService,
      this._providers.scriptManager,
    );
    new ExpressInspectorMiddleware().init(this._broker, this._providers);
    new MongoDBInspector().init(this);
    new MongoDBCoreInspector().init(this);
    new ClientRequestInspector().init(this, this._providers.errorReportingService);

    // Setup the Module Manager
    const moduleManager = new ModuleManager();
    moduleManager.setErrorReportingService(this._errorReportingService);
    moduleManager.init(this, require('module'));

    // always load console instrumentation manager and underlying proxy
    // first since we need to trap console methods before console module
    // gets loaded
    moduleManager.addModuleInstrumentor(new ConsoleModuleInstrumentor());
    require('console'); // Force load console instrumentation

    // Load the rest of the instrumentation managers
    moduleManager.addModuleInstrumentor(new HttpModuleInstrumentor());
    moduleManager.addModuleInstrumentor(new ExpressModuleInstrumentor());
    moduleManager.addModuleInstrumentor(new MongoDBCoreModuleInstrumentor());
    moduleManager.addModuleInstrumentor(new MongoDBModuleInstrumentor());
    moduleManager.addModuleInstrumentor(new KnexModuleInstrumentor());
    moduleManager.addModuleInstrumentor(new MorganModuleInstrumentor());
    moduleManager.addModuleInstrumentor(new BodyParserModuleInstrumentor());
    moduleManager.addModuleInstrumentor(new CookieParserModuleInstrumentor());

    // Notify server of agent version
    if (options.server) {
      const packageHelper = PackageHelper.instance;
      const packageJson = packageHelper.getPackageFromChildPath(__dirname);
      options.server.providers.versionInfoService.registerAgent(packageJson.name, packageJson.version);
    } else {
      printBannerGreeting();
    }

    this._resourceProvider.init(this._contextManager, this.providers.deferredInitializationManager, options);
    this._messagePublisher.init(options);

    this.sendAgentInitEvent();
  }

  private sendAgentInitEvent() {
    const props: IProperties = {};
    const appData = getTelemetryAppInstanceData(this.providers.configSettings);
    for (const p in appData) {
      if (appData.hasOwnProperty(p)) {
        props[p] = appData[p];
      }
    }
    const measurements: IMeasurements = {};

    this._telemetryService.sendEvent(TelemetryEvents.NODE_AGENT_INIT, props, measurements);
  }

  private validateReferencedPackages() {
    if (this.providers.configSettings.getBoolean('agent.validate-packages.enabled', true)) {
      const excludedPackages = this.providers.configSettings.get('agent.validate-packages.excludedPackages', []);
      const packageNames = RequireAnalyzer.getReferencedPackageNames(require.cache, excludedPackages);

      if (packageNames.length > 0) {
        packageNames.forEach((packageName) => {
          this.providers.errorReportingService.reportError(createPackageRequiredBeforeInitError(packageName));
        });
      }
    }
  }
}
