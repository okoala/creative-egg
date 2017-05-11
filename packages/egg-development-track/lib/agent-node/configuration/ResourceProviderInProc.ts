'use strict';

import { IContextManager } from '../messaging/IContextManager';
import { IResourceProvider } from './IResourceProvider';
import { RequestHelper } from '../util/HttpHelper';

export class ResourceProviderInProc implements IResourceProvider {
    public constructor(private contextManager: IContextManager, private server) {
    }

    public getResourceDefinitions(): { [key: string]: string } {
        const context = this.contextManager.currentContext();

        if (context) {
            const protocol = RequestHelper.protocol(context.req);
            const host = RequestHelper.host(context.req);
            const baseUri = protocol + '://' + host + '/glimpse';

            return this.server.providers.resourceManager.getUriTemplates(baseUri);
        }

        return undefined;
    }
}
