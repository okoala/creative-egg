'use strict';

import { IConfigSettings } from '@glimpse/glimpse-common';
import { IResource } from './IResource';
import { IServer } from './../IServer';
import { UriTemplate } from './UriTemplate';

import path = require('path');
import url = require('url');

const baseUrlProperty = 'baseUrl';
const metadataUriProperty = 'metadataUri';
const experimentalModePropery = 'experimentalMode';

export class Resource implements IResource {
    private baseUrl: string;
    private baseUrlDirectory: string;
    private clientDirectory: string;

    public uriTemplate: string;
    public name: string;
    public type = 'client';
    public templateName: string;

    private configSettings: IConfigSettings;

    constructor(server: IServer, urlSuffix: string, contentLocationSuffix) {
        this.configSettings = server.providers.configSettings;
        const contentRoot = path.join(__dirname, '../../resources/embedded/client');
        this.clientDirectory = path.join(contentRoot, contentLocationSuffix);
        this.baseUrl = '/glimpse/client' + urlSuffix;
        this.name = 'client' + urlSuffix;

        this.baseUrlDirectory = `${this.baseUrl}/`;
        this.uriTemplate = `requests/{requestId}?baseUrl=${this.baseUrl}&hash={hash}{&follow,metadataUri}`;
        this.templateName = 'clientScriptTemplate' + urlSuffix;
    }

    public invoke(req, res, next) {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            // We ignore non-GET, non-HEAD requests.
            return next();
        }

        const parsedUrl = url.parse(req.originalUrl, /* parseQueryString: */ true);

        let basename = path.basename(parsedUrl.pathname);
        const extension = path.extname(basename);

        // Default to the index page if the request is not for a specific asset type (e.g. a CSS, PNG, etc.)...
        if (!extension) {
            basename = 'index.html';
        }

        // Determine if a redirect is necessary (but only for the index page)...
        if (this.needsExperimentalFlag(basename, parsedUrl) ||
            this.needsPathName(basename, parsedUrl) ||
            this.needsBaseUrl(basename, parsedUrl) ||
            this.needsMetadatUri(basename, parsedUrl)) {

            // Redirect '/glimpse/client' to '/glimpse/client/' to preserve relative paths of served HTML assets...
            if (parsedUrl.pathname === this.baseUrl) {
                parsedUrl.pathname = this.baseUrlDirectory;
            }

            // Add the baseUrl query parameter if not present...
            if (!parsedUrl.query[baseUrlProperty]) {
                parsedUrl.query[baseUrlProperty] = this.baseUrl;
            }

            // Add the metadataUri query parameter if not present...
            if (!parsedUrl.query[metadataUriProperty]) {
                const baseUri = UriTemplate.getBaseUri(this.configSettings, req);
                const metadataUri = `${baseUri}/metadata`;

                parsedUrl.query[metadataUriProperty] = metadataUri;
            }

            // Add the experimentalMode flag if not present...
            if (!parsedUrl.query[experimentalModePropery]) {
                parsedUrl.query[experimentalModePropery] = this.configSettings.getBoolean('enable.experimental.features', false);
            }

            // NOTE: parse() populates both query and search properties,
            //       but format() allows only one or the other be set.
            parsedUrl.search = undefined;

            const redirectUrl = url.format(parsedUrl);

            res.redirect(redirectUrl);
        }
        else {
            res.sendFile(path.join(this.clientDirectory, basename));
        }
    }

    private needsExperimentalFlag(baseName, parsedUrl): boolean {
        return baseName === 'index.html' && !parsedUrl.query[experimentalModePropery] &&
            this.configSettings.getBoolean('enable.experimental.features', false);
    }

    private needsPathName(baseName, parsedUrl): boolean {
        return baseName === 'index.html' && parsedUrl.pathname === this.baseUrl;
    }
    private needsBaseUrl(baseName, parsedUrl): boolean {
        return baseName === 'index.html' && !parsedUrl.query[baseUrlProperty];
    }

    private needsMetadatUri(baseName, parsedUrl): boolean {
        return baseName === 'index.html' && !parsedUrl.query[metadataUriProperty];
    }
}
