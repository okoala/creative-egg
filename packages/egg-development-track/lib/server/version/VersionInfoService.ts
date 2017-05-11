import * as _ from 'lodash';

import { IPackageHelper } from '@glimpse/glimpse-common';
import { IVersionInfoService, IVersionInfos } from './IVersionInfoService';

export class VersionInfoService implements IVersionInfoService {
    private agentVersions: IVersionInfos = {};
    private serverVersion: IVersionInfos = {};
    private dependenciesVersion: IVersionInfos = {};
    private resourceVersion: IVersionInfos = {};

    private clientProperty = 'client';
    private clientPathProperty = 'clientPath';
    private browserAgentProperty = 'browserAgent';
    private browserAgentPathProperty = 'browserAgentPath';
    private hudAgentProperty = 'hud';
    private hudAgentPathProperty = 'hudPath';

    private packageHelper: IPackageHelper;

    constructor(packageHelper: IPackageHelper) {
        this.packageHelper = packageHelper;

        this.discoverResourceVersions();
        this.discoverDependenciesVersions();
        this.discoverServerVersions();
    }

    private getServerPackage() {
        return this.packageHelper.getPackageFromChildPath(__dirname);
    }

    private discoverResourceVersions() {
        const serverPackageJson = this.getServerPackage();

        this.resourceVersion[this.clientProperty] = serverPackageJson[this.clientProperty] || serverPackageJson[this.clientPathProperty];
        this.resourceVersion[this.browserAgentProperty] = serverPackageJson[this.browserAgentProperty] || serverPackageJson[this.browserAgentPathProperty];
        this.resourceVersion[this.hudAgentProperty] = serverPackageJson[this.hudAgentProperty] || serverPackageJson[this.hudAgentPathProperty];
    }

    private discoverDependenciesVersions() {
        const commonPackageJson = this.packageHelper.getPackage(this.packageHelper.findGlimpseCommonPackageJsonPath());

        this.dependenciesVersion[commonPackageJson.name] = commonPackageJson.version;
    }

    private discoverServerVersions() {
        const serverPackageJson = this.getServerPackage();

        this.serverVersion[serverPackageJson.name] = serverPackageJson.version;
    }

    /**
     * Returns object containing version info for all (resource, dependencies, server
     * & agent) system components.
     */
    public get allInfo(): IVersionInfos {
        return _.assign({}, this.resourceVersion, this.agentVersions, this.serverVersion,
            this.dependenciesVersion) as IVersionInfos;
    }

    /**
     * Returns object containing version info for just the registered resources (client,
     * hud & browser agent).
     */
    public get resourceInfo(): IVersionInfos {
        return this.resourceVersion;
    }

    /**
     * Returns object containing version info for just the major common dependencies
     * (for instance Glimpse.Common).
     */
    public get dependenciesInfo(): IVersionInfos {
        return this.dependenciesVersion;
    }

    /**
     * Returns object containing version info for just the Glimpse Server.
     */
    public get serverInfo(): IVersionInfos {
        return this.serverVersion;
    }

    /**
     * Returns object containing version info for any registered Glimpse server side Agents.
     */
    public get agentInfo(): IVersionInfos {
        return this.agentVersions;
    }

    /**
     * Lets Glimpse server side Agents to have their version info be explicitly registered.
     */
    public registerAgent(name: string, version: string) {
        this.agentVersions[name] = version;
    }
}
