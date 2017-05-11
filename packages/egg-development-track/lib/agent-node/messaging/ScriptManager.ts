'use strict';

import * as html from 'htmlparser2';
import * as util from 'util';
import { EOL } from 'os';

import { IContext, IContextManager } from './IContextManager';
import { IResourceProvider } from '../configuration/IResourceProvider';
import { IScriptManager } from './IScriptManager';
import { PackageHelper } from '@glimpse/glimpse-common';

export class ScriptManager implements IScriptManager {
    private static hudScriptTemplate = 'hudScriptTemplate';
    private static clientScriptTemplate = 'clientScriptTemplate';
    private static contextTemplate = 'contextTemplate';
    private static metadataTemplate = 'metadataTemplate';
    private static browserAgentScriptTemplate = 'browserAgentScriptTemplate';
    private static messageIngressTemplate = 'messageIngressTemplate';
    private packageVersion: string;

    public constructor(private contextManager: IContextManager, private resourceProvider: IResourceProvider) {
        // only need to run this once, don't need to ping the HDD every request
        const packageHelper = PackageHelper.instance;
        const packagePath = packageHelper.findPackageJsonPath(__dirname);
        this.packageVersion = packageHelper.getPackageVersion(packagePath);
    }

    public injectScript(htmlbody, payload: string) {
        if (typeof htmlbody === 'string' && payload) {
            const parser = new html.Parser(
                {
                    onopentag: function onOpenTag(name) {
                        if (name === 'head') {
                            const injectionIndex = parser.endIndex + 1;

                            if (htmlbody[parser.endIndex - 1] === '/') {
                                // The HEAD element is a "unary" tag so we "extend" it to include the payload...
                                htmlbody = htmlbody.slice(0, parser.endIndex - 2) + `>${payload}</head>` + htmlbody.slice(injectionIndex);
                            }
                            else {
                                // The HEAD element has start and end tags, so just inject the payload within them...
                                htmlbody = htmlbody.slice(0, injectionIndex) + payload + htmlbody.slice(injectionIndex);
                            }

                            parser.pause();
                        }
                        else if (name === 'body') {
                            const injectionIndex = parser.startIndex;

                            // There is no HEAD element, so create one with the injected payload...
                            htmlbody = htmlbody.slice(0, injectionIndex) + `<head>${payload}</head>` + htmlbody.slice(injectionIndex);

                            parser.pause();
                        }
                    }
                },
                {
                    decodeEntities: true
                });

            parser.write(htmlbody);
            parser.end();
        }

        return htmlbody;
    }

    private getCurrentContextId(context: IContext) {
        const id = context ? context.id : '00000000-0000-0000-0000-000000000000';
        return id;
    }

    private wrapScripts(scripts: string) {

        return EOL + `<!-- BEGIN Block - Project Glimpse: Node Edition - ${this.packageVersion} -->` + EOL
            + '<!-- Issues? Let us know https://github.com/Glimpse/Glimpse/issues/new -->' + EOL
            + scripts
            + `<!-- END Block - Project Glimpse: Node Edition -->` + EOL;
    }

    private hudScript(context: IContext, resources) {

        const uri = '<script src="%s" id="__glimpse_hud" data-request-id="%s" data-client-template="%s" data-context-template="%s" data-metadata-template="%s"></script>' + EOL;

        return util.format(
            uri,
            resources[ScriptManager.hudScriptTemplate],
            this.getCurrentContextId(context),
            resources[ScriptManager.clientScriptTemplate],
            resources[ScriptManager.contextTemplate],
            resources[ScriptManager.metadataTemplate]);
    };

    private agentScript(context: IContext, resources) {
        const uri = '<script src="%s" id="__glimpse_browser_agent" data-request-id="%s" data-message-ingress-template="%s"></script>' + EOL;

        return util.format(
            uri,
            resources[ScriptManager.browserAgentScriptTemplate],
            this.getCurrentContextId(context),
            resources[ScriptManager.messageIngressTemplate]);
    };

    public getScriptTagsForCurrentRequest(context: IContext) {
        const resources = this.resourceProvider.getResourceDefinitions();

        return this.wrapScripts(this.hudScript(context, resources) + this.agentScript(context, resources));
    }
}
