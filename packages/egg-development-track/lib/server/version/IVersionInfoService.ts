export interface IVersionInfos {
    [key: string]: string;
}

/**
 * Service for discovering and registering system version information.
 */
export interface IVersionInfoService {
    /**
     * Returns object containing version info for all (resource, dependencies, server
     * & agent) system components.
     */
    allInfo: IVersionInfos;

    /**
     * Returns object containing version info for just the registered resources (client,
     * hud & browser agent).
     */
    resourceInfo: IVersionInfos;

    /**
     * Returns object containing version info for just the major common dependencies
     * (for instance Glimpse.Common).
     */
    dependenciesInfo: IVersionInfos;

    /**
     * Returns object containing version info for just the Glimpse Server.
     */
    serverInfo: IVersionInfos;

    /**
     * Returns object containing version info for any registered Glimpse server side Agents.
     */
    agentInfo: IVersionInfos;

    /**
     * Lets Glimpse server side Agents to have their version info be explicitly registered.
     */
    registerAgent(name: string, version: string);
}
