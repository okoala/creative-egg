'use strict';

import { IModuleManager } from './IModuleManager';
import { IModuleInstrumentor } from './IModuleInstrumentor';
import { IModuleInfo } from './IModuleInfo';
import { getModuleInfo } from './ModuleIdentifier';
import { IAgent } from '../IAgent';
import { satisfies } from 'semver';
import { IErrorReportingService, createUnsupportedPackageRequiredError } from '@glimpse/glimpse-common';

interface IModuleInstrumentorEntry {
    instrumentor: IModuleInstrumentor;
    enabledModules: { [modulePath: string]: boolean };
}

export class ModuleManager implements IModuleManager {

    private nonExperimentalModules: Map<string, boolean> = new Map();

    private agent: IAgent;
    private moduleInstrumentors: { [moduleId: string]: IModuleInstrumentorEntry[] } = {};
    private unsupportedVersions: { [moduleId: string]: string[] } = {};
    private errorReportingService: IErrorReportingService;
    private moduleModule;
    private originalRequire;

    public init(agent: IAgent, moduleModule) {
        this.nonExperimentalModules.set('console', true);
        this.nonExperimentalModules.set('http', true);
        this.nonExperimentalModules.set('https', true);
        this.nonExperimentalModules.set('express', true);
        this.nonExperimentalModules.set('mongodb-core', true);
        this.nonExperimentalModules.set('mongodb', true);

        this.agent = agent;
        this.moduleModule = moduleModule;
        this.originalRequire = moduleModule.prototype.require;

        const self = this;
        const configSettings = self.agent.providers.configSettings;

        const glimpseRequire = function glimpseRequire(moduleId) {

            const originalModule = self.originalRequire.call(this, moduleId);

            // _resolveFilename isn't cleanly exposed, but we can access via `this.constructor`.
            // require.resolve(id) doesn't work correctly here since it will run in the context of the Glimpse.Agent
            // module, and not in the context of the module we're trying to load.
            const modulePath = this.constructor._resolveFilename(moduleId, this);

            // Note: check if config settings are available and check the config
            // settings if it is. Default to true if config settings aren't
            // available or if the user did not explicitly specify whether or
            // not to enable this module
            const isExperimentalModeModule = self.isExperimentalModeModule(moduleId);
            let isEnabled = true;
            if (isExperimentalModeModule) {
                isEnabled = configSettings ? configSettings.getBoolean('enable.experimental.features', false) : false;
            }

            if (isEnabled) {
                isEnabled = configSettings ? configSettings.getBoolean(`instrumentor.${moduleId}.enabled`, true) : true;
            }

            if (self.moduleInstrumentors[moduleId] && isEnabled) {

                const moduleInfo: IModuleInfo = getModuleInfo(moduleId, modulePath, originalModule);

                for (const instrumentorEntry of self.moduleInstrumentors[moduleId]) {
                    const supportedVersion = instrumentorEntry.instrumentor.supportedModules[moduleId];
                    if (satisfies(moduleInfo.version, supportedVersion)) {
                        if (!instrumentorEntry.enabledModules[modulePath]) {
                            const result = instrumentorEntry.instrumentor.enableInstrumentation(moduleInfo);
                            instrumentorEntry.enabledModules[modulePath] = result.isEnabled;
                        }
                    } else {
                        // If we got here, it means we do support instrumenting
                        // the given module, but not the specific version of the
                        // module, so we want to report this. However, it's
                        // pretty common for the same module to be required
                        // multiple times and we don't want to flood the
                        // reporting service, so we keep track of what we've
                        // reported so far, and only report on the first time
                        if (!self.unsupportedVersions[moduleId]) {
                            self.unsupportedVersions[moduleId] = [];
                        }
                        if (self.unsupportedVersions[moduleId].indexOf(moduleInfo.version) === -1) {
                            self.unsupportedVersions[moduleId].push(moduleInfo.version);
                            if (self.errorReportingService) {
                                self.errorReportingService.reportError(createUnsupportedPackageRequiredError(
                                    moduleId, moduleInfo.version, supportedVersion));
                            }
                        }
                    }
                }
            }

            return originalModule;
        };

        moduleModule.prototype.require = glimpseRequire;
    }

    /**
     * returns true if this is an experimental module, false otherwise
     */
    private isExperimentalModeModule(moduleId: string): boolean {
        return !(this.nonExperimentalModules.has(moduleId));
    }

    public destroy() {
        this.moduleModule.prototype.require = this.originalRequire;
    }

    public addModuleInstrumentor(instrumentor: IModuleInstrumentor) {
        // Temporary hack to support old proxies without having to modify the
        // public signatures for instrumentors/the module manager
        // tslint:disable:no-string-literal
        if (instrumentor['setAgent']) {
            instrumentor['setAgent'](this.agent);
        }
        // tslint:enable:no-string-literal

        for (const moduleId of Object.keys(instrumentor.supportedModules)) {
            if (!this.moduleInstrumentors[moduleId]) {
                this.moduleInstrumentors[moduleId] = [];
            }
            this.moduleInstrumentors[moduleId].push({
                instrumentor,
                enabledModules: {}
            });
        }
    }

    public setErrorReportingService(service: IErrorReportingService) {
        this.errorReportingService = service;
    }
}
