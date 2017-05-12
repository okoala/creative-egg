import { IAgentBroker } from './messaging/IAgentBroker';
import { IContextManager } from './messaging/IContextManager';
import { IDateTime } from './configuration/IDateTime';
import IDeferredInitializationManager from './IDeferredInitializationManager';
import { IErrorReportingService } from '../common';
import { IMessagePublisher } from './messaging/IMessagePublisher';
import { IResourceProvider } from './configuration/IResourceProvider';
import { IScriptManager } from './messaging/IScriptManager';
import { IConfigSettings, ITelemetryService } from '../common';
import { IStackHelper } from './inspectors/util/StackHelper';
import { IMessageConverter } from './messaging/IMessageConverter';

/**
 * Represents the set of options with which to configure the agent.
 */
export interface IAgentOptions {

  /**
   * (Optional) The URI of the metadata endpoint for the Glimpse server, if not embedded in-process.
   */
  metadataUri?: string;

  /**
   * (Optional) The instance of embedded, in-process Glimpse server.
   */
  server?;
}

/**
 *  Exposes the set of service providers for use by other Glimpse components.
 *
 *  Glimpse components should use these instances in favor of importing a service provider themselves.
 */
export interface IAgentProviders {
  contextManager: IContextManager;
  dateTime: IDateTime;
  deferredInitializationManager: IDeferredInitializationManager;
  errorReportingService: IErrorReportingService;
  messagePublisher: IMessagePublisher;
  resourceProvider: IResourceProvider;
  scriptManager: IScriptManager;
  configSettings: IConfigSettings;
  telemetryService: ITelemetryService;
  stackHelper: IStackHelper;
  messageConverter: IMessageConverter;
}

/**
 *  Represents the root Glimpse agent component.
 */
export interface IAgent {
  broker: IAgentBroker;
  providers: IAgentProviders;

  init(options?: IAgentOptions);
}
