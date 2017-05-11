'use strict';

import { IConfigSettings } from '@glimpse/glimpse-common';
import { IResource } from './IResource';
import { IResourceManager } from './IResourceManager';
import { IServer } from '../IServer';
import { UriTemplate } from './UriTemplate';

export class Resource implements IResource {
    private configSettings: IConfigSettings;
    private resourceManager: IResourceManager;

    constructor(server: IServer) {
        this.configSettings = server.providers.configSettings;
        this.resourceManager = server.providers.resourceManager;
    }

    public name = 'export-config';
    public uriTemplate = '?hash={hash}';
    public type = 'client';
    public invoke(req, res) {
        const baseUri = UriTemplate.getBaseUri(this.configSettings, req);
        const resources = this.resourceManager.getUriTemplates(baseUri);

        res.setHeader('Content-Disposition', 'attachment; filename = glimpse.json');
        res.json(resources);
    };
}
