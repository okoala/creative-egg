'use strict';

import {IConfigSettings} from './../configuration/IConfigSettings';

const appInsightsKey = 'AIF-a96980ad-8a38-47a2-bbb0-328338b6964a';
const appInsightsURI = 'https://vortex.data.microsoft.com/collect/v1';
const privacyPolicy =  'http://go.microsoft.com/fwlink/?LinkId=521839&CLCID=0409';

/**
 *  Shape of telemetry config resource returned from the server.
 */
export interface ITelemetryConfig {
    /** flag indicating if sending telemetry from client is enabled or disabled. */
    enabled: boolean;

    /** Application Insights endpoint URI for sending telemetry */
    uri: string;

    /** Application Insights instrumentation key */
    instrumentationKey: string;

    /** link to Microsoft privacy Policy. */
    privacyPolicy: string;
}

export function getTelemetryConfig(configSettings: IConfigSettings): ITelemetryConfig {
    // TODO:  read info from configSettings
    const config: ITelemetryConfig = {
        enabled: configSettings.getBoolean('telemetry.enabled', true),
        instrumentationKey: configSettings.get('telemetry.key', appInsightsKey),
        uri: configSettings.get('telemetry.uri', appInsightsURI),
        privacyPolicy: privacyPolicy
    };
    return config;
}
