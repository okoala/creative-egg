'use strict';

import { Hash } from '../services/hash';
import { IConfigSettings } from '@glimpse/glimpse-common';
import { IResource } from './IResource';
import { IResourceManager } from './IResourceManager';
import { IVersionInfoService } from '../version/IVersionInfoService';
import { IServer } from './../IServer';
import { UriTemplate } from './UriTemplate';

import * as _ from 'lodash';

export class Resource implements IResource {
    private configSettings: IConfigSettings;
    private resourceManager: IResourceManager;
    private versionInfoService: IVersionInfoService;

    constructor(server: IServer) {
        this.configSettings = server.providers.configSettings;
        this.resourceManager = server.providers.resourceManager;
        this.versionInfoService = server.providers.versionInfoService;
    }

    public name = 'metadata';
    public uriTemplate = '?hash={hash}';
    public templateName = 'metadataTemplate';
    public type = 'client';
    public invoke(req, res) {
        const baseUri = UriTemplate.getBaseUri(this.configSettings, req);

        const resources = _(this.resourceManager.resources)
            .reduce<{ [key: string]: string }>(
                (result, resource) => {
                    result[resource.name] = UriTemplate.fromResource(baseUri, resource);
                    return result;
                },
                {});

        const resourceHash = Hash.hashObject(resources);

        const metadata = {
            'versions': this.versionInfoService.allInfo,
            'resources': resources,
            'hash': resourceHash,
            'experimentalMode' : this.configSettings.getBoolean('enable.experimental.features', false)
        };

        res.json(metadata);
    };
}
