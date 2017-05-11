'use strict';

import { IResource } from './IResource';
import { IServer } from '../IServer';

import { getTelemetryConfig } from '@glimpse/glimpse-common';
import { getTelemetryAppInstanceData } from '@glimpse/glimpse-common';
import { ITelemetryConfig } from '@glimpse/glimpse-common';
import { ITelemetryAppInstanceData } from '@glimpse/glimpse-common';

/**
 *  Shape of telemetry config resource returned from the server.
 */
export interface IClientTelemetryInfo extends ITelemetryConfig {

    /** IP address of the glimpse client as observed by the glimpse server */
    clientIP: string;

    /** server's telemetry session ID to correlate client telemetry events with server telemetry events */
    serverSessionId: string;

    /** serverGlimpseVersion */
    serverGlimpseVersion: string;

    /** unique ID for the machine hosting the server.  This is a SHA256 hash of the machine's mac address. */
    serverMachineId: string;

    /** name of the application hosting the glimpse.server */
    serverAppName: string;

    /** OS Platform where server is running */
    serverOSPlatform: string;

    /** OS Release where server is running */
    serverOSRelease: string;

    /** OS Type where server is running */
    serverOSType: string;

    /** version of the runtime where the server is running */
    serverRuntimeVersion: string;

    /** name of the runtime where the server is running */
    serverRuntimeName: string;
}

/**
 * Resource for telemetry configuration details to enable client to send telemetry data.
 *
 * Microsoft values privacy.  For details, please see our privacy
 * statement at http://go.microsoft.com/fwlink/?LinkId=521839&CLCID=0409.
 */
export class Resource implements IResource {

    public name = 'telemetry-config';
    public templateName = 'telemetryConfigTemplate';
    public uriTemplate = '';
    public type = 'client';

    private appInstanceData: ITelemetryAppInstanceData;
    private telemetryConfig: ITelemetryConfig;
    private serverTelemetrySessionId: string;

    public constructor(server: IServer) {
        this.telemetryConfig = getTelemetryConfig(server.providers.configSettings);
        this.appInstanceData = getTelemetryAppInstanceData(server.providers.configSettings);
        this.serverTelemetrySessionId = server.providers.telemetryService.getSessionId();
    }

    /**
     *  returns an ITelemetryConfig object with the appropriate values.
     */
    public createTelemetryConfig(clientIP: string): IClientTelemetryInfo {
        return {
            clientIP,
            serverSessionId: this.serverTelemetrySessionId,

            // ITelemetryConfig
            enabled: this.telemetryConfig.enabled,
            instrumentationKey: this.telemetryConfig.instrumentationKey,
            uri: this.telemetryConfig.uri,
            privacyPolicy: this.telemetryConfig.privacyPolicy,

            // ITelemetryAppInstanceData
            serverGlimpseVersion: this.appInstanceData.glimpseVersion,
            serverMachineId: this.appInstanceData.machineId,
            serverAppName: this.appInstanceData.appName,
            serverOSPlatform: this.appInstanceData.operatingSystemPlatform,
            serverOSRelease: this.appInstanceData.operatingSystemRelease,
            serverOSType: this.appInstanceData.operatingSystemType,
            serverRuntimeVersion: this.appInstanceData.runtimeVersion,
            serverRuntimeName: this.appInstanceData.runtimeName
        };
    }

    /**
     * Invoke the resource
     */
    public invoke(req, res) {
        res.status(200);
        res.type('application/json');
        res.send(this.createTelemetryConfig(req.socket.remoteAddress));
    }
}
