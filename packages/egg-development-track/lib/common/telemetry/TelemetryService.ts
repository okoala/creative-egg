
'use strict';

import {ITelemetryConfig} from './TelemetryConfig';
import uuid = require('uuid');

/* tslint:disable:no-var-requires */
const appInsights = require('applicationinsights');
/* tslint:enable:no-var-requires */

/**
 * Map from string -> string. Used to pass name/value pairs through app insights events.
 */
export interface IProperties {
    [key: string]: string;
}

/**
 * Map from string -> number.  Used to pass measurements through app insights events
 */
export interface IMeasurements {
    [key: string]: number;
}

/** indicates which of the various glimpse components is sending the event */
export enum GlimpseComponentType { OTHER, NODE_SERVER, BROWSER_AGENT, NODE_AGENT, CLIENT, HUD };

/**
 * Common properties shared by all events passed to app insights
 */
export interface ICommonProperties extends IProperties {
    /** unique identifier for this instance of the glimpse client. */
    sessionId: string;

    /** glimpse */
    glimpseComponentType: string;
}

/**
 * Shape of object defining
 */
export interface ITelemetryEvent {
    name: string;
    properties: ICommonProperties; // map string->string
    measurements: IMeasurements; // map string->number
}

export interface ITelemetryService {
    isEnabled(): boolean;
    sendEvent(eventName: string, properties: IProperties, measurements: IMeasurements);
    getSessionId(): string;
}

/**
 * Class responsible for sending telemetry events.
 *
 * Microsoft values privacy.  For details, please see our privacy
 * statement at http://go.microsoft.com/fwlink/?LinkId=521839&CLCID=0409.
 */
export class TelemetryService implements ITelemetryService {

    private componentType: GlimpseComponentType;

    // telemetry configuration details retrieved from the glimpse server.  This is populated asynchronously, so there's logic to 
    // account for events sent before & after telemetryConfig is available.
    private telemetryConfig: ITelemetryConfig;

    private aiClient: typeof appInsights.client;

    // telemetry enabled defaults to true, value will be reset when we receive the telemetryConfig.
    private isTelemetryEnabled = true;
    private sessionId: string;

    constructor(componentType: GlimpseComponentType, telemetryConfig: ITelemetryConfig) {
        this.componentType = componentType;
        this.telemetryConfig = telemetryConfig;

        this.isTelemetryEnabled = telemetryConfig ? telemetryConfig.enabled : false;

        if (this.isTelemetryEnabled) {
            appInsights.setup('00000000-0000-0000-0000-000000000000')
                .setAutoCollectConsole(false)
                .setAutoCollectExceptions(false)
                .setAutoCollectPerformance(false)
                .setAutoCollectRequests(false);

            const client = appInsights.getClient(telemetryConfig.instrumentationKey);
            client.context.tags[client.context.keys.deviceMachineName] = ''; //prevent App Insights from reporting machine name
            client.config.endpointUrl = telemetryConfig.uri;
            this.aiClient = client;
        }

        this.sessionId = uuid.v4();
    }

    public getSessionId() {
        return this.sessionId;
    }

    public isEnabled() {
        return this.isTelemetryEnabled;
    }

    /**
     * send an event (if app insights is currently configured), or queue it for sending later when app insights is configured.
     */
    public sendEvent(eventName: string, properties: IProperties, measurements: IMeasurements) {
        if (this.isTelemetryEnabled && this.aiClient) {

            // ensure we have the "common properties" required for all events
            let cp = <ICommonProperties>properties;
            if (!cp.sessionId || !cp.glimpseComponentType) {
                // make shallow clone of object
                const newProps: IProperties = {};
                for (let p in properties) {
                    if (properties.hasOwnProperty(p)) {
                        newProps[p] = properties[p];
                    }
                }
                cp = <ICommonProperties>newProps;
                cp.sessionId = this.sessionId;
                cp.glimpseComponentType = GlimpseComponentType[this.componentType];
            }

            this.aiClient.trackEvent(eventName, cp, measurements);
        }
    }
}
