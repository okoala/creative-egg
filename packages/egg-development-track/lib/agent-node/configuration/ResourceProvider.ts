import { IContextManager } from '../messaging/IContextManager';
import { IDeferredInitializationManager } from '../IDeferredInitializationManager';
import { IResourceProvider } from './IResourceProvider';
import { ResourceProviderHttp } from './ResourceProviderHttp';
import { ResourceProviderInProc } from './ResourceProviderInProc';

export interface IResourceProviderOptions {
  metadataUri?: string;
  server?;
}

export class ResourceProvider implements IResourceProvider {
  private provider: IResourceProvider;

  public getResourceDefinitions(): { [key: string]: string } {
    return this.provider.getResourceDefinitions();
  }

  public init(
    contextManager: IContextManager,
    deferredInitializationManager: IDeferredInitializationManager,
    options: IResourceProviderOptions,
  ): void {
    if (options && options.metadataUri) {
      this.provider = new ResourceProviderHttp(options.metadataUri, deferredInitializationManager);
    } else if (options && options.server) {
      this.provider = new ResourceProviderInProc(contextManager, options.server);
    } else {
      throw new Error('One of the \'metadataUri\' or \'server\' options must be specified.');
    }
  }
}
