import { AppInsights } from 'applicationinsights-js';
import * as uuid from 'node-uuid';
import { current as currentMetadata } from 'modules/metadata/MetadataActions';
import { IStoreState } from 'client/IStoreState';
import {
    getLoggingTabMeasurements,
    getRequestHeaderTelemetryProperties,
    getResponseHeaderTelemetryProperties,
    getRequestHeaderTelemetryMeasurements,
    getResponseHeaderTelemetryMeasurements,
    getMiddlewareTelemetryMeasurements,
    getMiddlewareTelemetryMaxDepth,
    getMiddlewareTelemetryProperties,
    getTimelineTabMeasurements,
    getServicesTabMeasurements
} from './TelemetrySelectors';
import { serviceTabName } from 'routes/requests/details/service/ServiceConfig';

/**
 * Shape of the IClientTelemetryInfo message returned from the server.
 * See definition in Glimpse.Node repo  at src/glimpse.server/resources/TelemetryConfigResource.ts.
 */
export interface IClientTelemetryInfo {

    /** IP address of the glimpse client as observed by the glimpse server */
    clientIP: string;

    /** session ID of the server */
    serverSessionId: string;

    /** flag indicating if sending telemetry from client is enabled or disabled. */
    enabled: boolean;

    /** Application Insights instrumentation key */
    instrumentationKey: string;

    /** Application Insights endpoint URI for sending telemetry */
    uri: string;

    /** link to Microsoft privacy Policy. */
    privacyPolicy: string;

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
 * Map from string -> string. Used to pass name/value pairs through app insights events.
 */
export interface IProperties {
    [key: string]: string;
}

/**
 * Map from string -> number.  Used to pass measurements through app insights events
 */
interface IMeasurements {
    [key: string]: number;
}

/**
 * Common properties shared by all events passed to app insights
 */
interface ICommonProperties extends IProperties {
    /** unique identifier for this instance of the glimpse client. */
    sessionId: string;
}

/**
 * properties sent on ShellReady event.
 */
interface IShellReadyProperties extends ICommonProperties {

    /** version of the glimpse server */
    glimpseServerVersion: string;

    /** version of the glimpse client */
    glimpseClientVersion: string;

    /** version of the glimpse hud */
    glimpseHUDVersion: string;

    /** version of the glimpse browser agent */
    glimpseBrowserAgentVersion: string;

    /** semi-colon seperated list of glimpse agent versions */
    glimpseAgentVersion: string;

    /** unique identifier for the machine where the glimpser.server is running. */
    serverMachineId: string;

    /** app name where server is running, as returned from the TelemetryConfigResource. */
    serverAppName: string;

    /** OS platform where server is running, as returned from the TelemetryConfigResource. */
    serverOSPlatform: string;

    /** OS Release where server is running, as returned from the TelemetryConfigResource. */
    serverOSRelease: string;

    /** OS Type where server is running, as returned from the TelemetryConfigResource. */
    serverOSType: string;

    /** this client's IP address as observed by the glimpse server. */
    clientIP: string;

    /** unique identifier for this client stored in a browser cookie. */
    clientCookieID: string;

    /** boolean string value, 'true' indicates this is an development build, anyy other value indicates it is a released build */
    isDevelopmentBuild: string;

    /** session ID of the server */
    serverSessionId: string;
}

interface IShellReadyMeasurements extends IMeasurements {

    /** screen height in pixes */
    screenHeight: number;

    /** screen width in pixes */
    screenWidth: number;

    /** window height in pixes */
    windowHeight: number;

    /** window width in pixes */
    windowWidth: number;

    /** top-left most position of the window */
    leftPosition: number;
}

/**
 *  Properties sent when a request detail is selected
 */
interface IRequestDetailSelectedProperties extends ICommonProperties {
    /** ID of the current request */
    currentRequestId: string;

    /** ID of the next request */
    nextRequestId: string;

    /** Name of the current tab being viewed. */
    currentTabName: string;

    /** Name of the previous tab being viewed. */
    nextTabName: string;

    /** HTTP method of the request being viewed. */
    method: string;

    /** protocol scheme of the request being viewed. */
    protocol: string;
}

/**
 * Measurements sent on RequestDetailSelected event.
 */
interface IRequestDetailSelectedMeasurements extends IMeasurements {

    /** number of milliseconds spent viewing the curent request before we switch to the next request */
    currentRequestViewTimeMillis: number;

    /** number of milliseconds spent viewing the previous tab before we switch to the next request */
    currentTabViewTimeMillis: number;

    /** status code of the request being viewed */
    statusCode: number;

    /** urlLength of the request being viewed */
    urlLength: number;

    /** request header length of the request being viewed */
    requestHeaderLength: number;

    /** response header length of the request being viewed */
    responseHeaderLength: number;
}

/**
 * Properties sent  when user closes a request detail view.
 */
interface IRequestDetailClosedProperties extends ICommonProperties {

    /**  request ID when the request details tab closed */
    currentRequestId: string;

    /** tab name in use when the request details tab closed */
    currentTabName: string;
}

/**
 * Measurements sent when user closes a request detail view.
 */
interface IRequestDetailClosedMeasurements extends IMeasurements {

    /** number of milliseconds spent viewing the currently viewed request */
    currentRequestViewTimeMillis: number;

    /** number of milliseconds spent viewing the currently viewed tab */
    currentTabViewTimeMillis: number;
}

/**
 * Properties sent when user changes tab being viewed for a request.
 */
interface IRequestDetailTabChangedProperties extends ICommonProperties {
    /**  current request ID when the tab changes */
    currentRequestId: string;

    /** Name of the next  tab to be viewed. */
    nextTabName: string;

    /** Name of the current tab being viewed. */
    currentTabName: string;
}

/**
 * Measurements sent on RequestDetailTabChanged
 */
interface IRequestDetailTabChangedMeasurements extends IMeasurements {
    /** number of milliseconds spent viewing the current tab */
    currentTabViewTimeMillis: number;
}

/**
 * Shape of object defining
 */
interface ITelemetryEvent {
    name: string;
    properties: ICommonProperties; // map string->string
    measurements: IMeasurements; // map string->number
}

/**
 * Class responsible for sending telemetry events.  It will register to be notified on various shell events
 * and send telemetry events through app insights when those events occur.
 *
 * Microsoft values privacy.  For details, please see our privacy
 * statement at http://go.microsoft.com/fwlink/?LinkId=521839&CLCID=0409.
 *
 */
class TelemetryClient {

    private static shellReady = 'ShellReady';
    private static requestDetailSelected = 'RequestDetailSelected';
    private static requestDetailClosed = 'RequestDetailClosed';
    private static requestDetailTabChanged = 'RequestDetailTabChanged';
    private static defaultTab = '';

    // telemetry configuration details retrieved from the glimpse server.  This is populated asynchronously, so there's logic to
    // account for events sent before & after telemetryConfig is available.
    private telemetryConfig: IClientTelemetryInfo;

    // telemetry enabled defaults to true, value will be reset when we receive the telemetryConfig.
    private isTelemetryEnabled = true;
    private sessionId: string;
    private currentRequestId: string = '';
    private lastRequestChangeTime: number;
    private currentTab: string = '';
    private lastTabChangeTime: number;
    private clientCookieId: string;
    private glimpseClientVersion: string;
    private glimpseHUDVersion: string;
    private glimpseBrowserAgentVersion: string;
    private glimpseServerVersion: string;
    private glimpseAgentVersion: string;

    // we'll queue telemetry events until the telemetry config is downloaded and app insights is configured.
    private eventQueue: ITelemetryEvent[] = [];

    constructor() {
        this.glimpseClientVersion = '0.0';
        this.glimpseHUDVersion = '0.0';
        this.glimpseBrowserAgentVersion = '0.0';

        this.sessionId = uuid.v4();
        this.setupClientCookieId();

        currentMetadata((metadata) => {
            if (metadata.versions) {
                /*tslint:disable:no-string-literal */
                this.glimpseClientVersion = metadata.versions['client'];
                this.glimpseHUDVersion = metadata.versions['hud'];
                this.glimpseBrowserAgentVersion = metadata.versions['browserAgent'];
                this.glimpseAgentVersion = metadata.versions['@glimpse/glimpse-node-agent'];
                this.glimpseServerVersion = metadata.versions['@glimpse/glimpse-node-server'];
                /*tslint:enable:no-string-literal */
            }

            if (!metadata.resources || !metadata.resources['telemetry-config']) {
                this.isTelemetryEnabled = false;
            }
            else {
                //tslint:disable-next-line:no-any
                const uri = (<any>metadata.resources['telemetry-config']).fill({});
                // look up telemetry config
                fetch(uri)
                    .then<IClientTelemetryInfo>((response) => {
                        return response.json();
                    })
                    .then((telemetryConfig) => {
                        this.telemetryConfig = telemetryConfig;
                        this.configure(telemetryConfig);
                    })
                    .catch((err) => {
                        console.error('Glimpse telemetry config could not be obtained: ' + err);

                    });
            }
        });
    }

    /**
     * Send a telemetry event
     */
    public sendEvent(name: string, properties: IProperties, measurements: IMeasurements) {
        const commonProps: ICommonProperties = Object.assign({sessionId: this.sessionId}, properties);
        this.queueOrSendEvent(name, commonProps, measurements);
    }

    /**
     * configure telemetry client
     */
    private configure(telemetryConfig) {
        this.isTelemetryEnabled = (telemetryConfig && telemetryConfig.enabled) ? telemetryConfig.enabled : false;
        if (!this.isTelemetryEnabled) {
            // shouldn't need this any longer
            this.eventQueue = undefined;
        }
        else {

            // Call downloadAndSetup to download full ApplicationInsights script from CDN and initialize it with instrumentation key.
            AppInsights.downloadAndSetup({
                instrumentationKey: telemetryConfig.instrumentationKey,
                endpointUrl: telemetryConfig.uri,
                emitLineDelimitedJson: true
            });

            // Add telemetry initializer to enable user tracking
            // TODO:  verify this works
            AppInsights.queue.push(function () {
                AppInsights.context.addTelemetryInitializer(function (envelope) {
                    if (window.navigator && window.navigator.userAgent) {
                        envelope.tags['ai.user.userAgent'] = window.navigator.userAgent;
                    }
                    return true;
                });
            });

            // now that we have the telemetry config, send any queued events
            while (this.eventQueue.length > 0) {
                const event = this.eventQueue.shift();

                // back-fill any property data available from the telemetryConfig
                if (event.name === TelemetryClient.shellReady) {
                    this.getShellReadyProperties(<IShellReadyProperties>event.properties);
                }

                // send event through app insights API
                AppInsights.trackEvent(event.name, event.properties, event.measurements);
            }
        }
    }

    /**
     * read client ID from cookie, or generate a new ID & store it in a cookie.
     */
    private setupClientCookieId() {
        // TODO:  when we move to new client, implement this.
        this.clientCookieId = 'TODO';
    }

    /**
     * send an event (if app insights is currently configured), or queue it for sending later when app insights is configured.
     */
    private queueOrSendEvent(name: string, properties: ICommonProperties, measurements: IMeasurements) {
        if (this.isTelemetryEnabled) {
            if (!this.telemetryConfig) {
                this.eventQueue.push({ name, properties, measurements });
            }
            else {
                AppInsights.trackEvent(name, properties, measurements);
            }
        }
    }

    /**
     * update lastRequestChangeTime & return delta (in milliseconds) between current time & previous time
     */
    private markLastRequestViewMillis(): number {
        const nextEventTime = window.performance.now();
        let elapsed = 0;
        if (this.lastRequestChangeTime) {
            elapsed = (nextEventTime - this.lastRequestChangeTime);
        }
        this.lastRequestChangeTime = nextEventTime;
        return elapsed;
    }

    /**
     * update lastTabChangeTime & return delta (in milliseconds) between current time & previous time
     */
    private markLastTabViewMillis(): number {
        const nextEventTime = window.performance.now();
        let elapsed = 0;
        if (this.lastTabChangeTime) {
            elapsed = (nextEventTime - this.lastTabChangeTime);
        }
        this.lastTabChangeTime = nextEventTime;
        return elapsed;
    }

    /**
     * Retrieve shell-ready properties (if telemetry config is available).  If a set of props is passed in,
     * then the specified props will be updated.  Otherwise, a new instance will returned.
     */
    private getShellReadyProperties(props?: IShellReadyProperties): IShellReadyProperties {
        if (!props) {
            const p: IShellReadyProperties = {
                sessionId: undefined,
                clientCookieID: undefined,
                glimpseClientVersion: undefined,
                glimpseHUDVersion: undefined,
                glimpseBrowserAgentVersion: undefined,
                glimpseServerVersion: undefined,
                glimpseAgentVersion: undefined,
                serverMachineId: undefined,
                serverAppName: undefined,
                serverOSPlatform: undefined,
                serverOSRelease: undefined,
                serverOSType: undefined,
                clientIP: undefined,
                isDevelopmentBuild: undefined,
                serverSessionId: undefined
            };
            props = p;
        }

        props.sessionId = this.sessionId;
        props.clientCookieID = this.clientCookieId;
        props.isDevelopmentBuild = !PRODUCTION ? 'true' : 'false';
        props.glimpseClientVersion = this.glimpseClientVersion;
        props.glimpseHUDVersion = this.glimpseHUDVersion;
        props.glimpseBrowserAgentVersion = this.glimpseBrowserAgentVersion;
        props.glimpseAgentVersion = this.glimpseAgentVersion;
        props.glimpseServerVersion = this.glimpseServerVersion;

        if (this.telemetryConfig) {
            props.serverMachineId = this.telemetryConfig.serverMachineId;
            props.serverAppName = this.telemetryConfig.serverAppName;
            props.serverOSPlatform = this.telemetryConfig.serverOSPlatform;
            props.serverOSRelease = this.telemetryConfig.serverOSRelease;
            props.serverOSType = this.telemetryConfig.serverOSType;
            props.clientIP = this.telemetryConfig.clientIP;
            props.serverSessionId = this.telemetryConfig.serverSessionId;
        }

        return props;
    }

    private getShellReadyMeasurements(): IShellReadyMeasurements {
        const props: IShellReadyMeasurements = {
            screenHeight: screen.height,
            screenWidth: screen.width,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            leftPosition: window.screenLeft || window.screenX
        };
        return props;
    }

    /**
     * retrieve the RequestDetailSelected properties.
     */
    private getRequestDetailSelectedProperties(
        nextRequestId: string,
        currentRequestId: string,
        nextTabName: string,
        currentTabName: string,
        webRequest,
        webResponse,
        currentRequestValid: boolean,
        state: IStoreState): IRequestDetailSelectedProperties {

        const props: IRequestDetailSelectedProperties = {
            sessionId: this.sessionId,
            currentRequestId,
            nextRequestId,
            currentTabName,
            nextTabName,
            method: undefined,
            protocol: undefined,
            currentRequestValid: `${currentRequestValid}`
        };

        if (webRequest && webResponse) {
            props.method = webRequest.method;
            props.protocol = webRequest.protocol && webRequest.protocol.identifier;
        }

        if (currentRequestValid) {
            Object.assign(props, this.getCustomTabProperties(currentTabName, state));
        }

        return props;
    }

    /**
     * retrieve the RequestDetailSelected measurements.
     */
    private getRequestDetailSelectedMeasurements(
        tabName: string,
        currentRequestViewTimeMillis: number,
        currentTabViewTimeMillis: number,
        webRequest, webResponse,
        currentRequestValid: boolean,
        state: IStoreState): IRequestDetailSelectedMeasurements {

        const props: IRequestDetailSelectedMeasurements = {
            currentRequestViewTimeMillis,
            currentTabViewTimeMillis,
            statusCode: undefined,
            urlLength: undefined,
            requestHeaderLength: undefined,
            responseHeaderLength: undefined
        };

        if (webRequest && webResponse) {
            props.statusCode = webResponse.statusCode;
            props.urlLength = webRequest.url && webRequest.url.length;
            props.requestHeaderLength = webRequest.headers && Object.keys(webRequest.headers).length;
            props.responseHeaderLength = webResponse.headers && Object.keys(webResponse.headers).length;
        }

        if (currentRequestValid) {
            Object.assign(props, this.getCustomTabMeasurements(tabName, state));
        }

        return props;
    }

    /**
     * Retrieve RequestDetailClosed properties.
     */
    private getRequestDetailClosedProperties(): IRequestDetailClosedProperties {
        const props: IRequestDetailClosedProperties = {
            sessionId: this.sessionId,
            currentRequestId: this.currentRequestId,
            currentTabName: this.currentTab
        };
        return props;
    }

    /**
     * Retrieve RequestDetailClosed measurements.
     */
    private getRequestDetailClosedMeasurements(currentRequestViewTimeMillis, currentTabViewTimeMillis): IRequestDetailClosedMeasurements {
        const props: IRequestDetailClosedMeasurements = {
            currentRequestViewTimeMillis,
            currentTabViewTimeMillis
        };
        return props;
    }

    /**
     * Retrieve RequestDetailTabChanged properties.
     */
    private getRequestDetailTabChangedProperties(nextTabName, currentTabName, state: IStoreState): IRequestDetailTabChangedProperties {
        const props: IRequestDetailTabChangedProperties = {
            sessionId: this.sessionId,
            currentRequestId: this.currentRequestId,
            nextTabName,
            currentTabName
        };

        Object.assign(props, this.getCustomTabProperties(currentTabName, state));

        return props;
    }

    /**
     * Retrieve RequestDetailTabChanged measurements.
     */
    private getRequestDetailTabChangedMeasurements(tabName: string, currentTabViewTimeMillis: number, state: IStoreState): IRequestDetailTabChangedMeasurements {
        const props: IRequestDetailTabChangedMeasurements = {
            currentTabViewTimeMillis
        };

        Object.assign(props, this.getCustomTabMeasurements(tabName, state));

        return props;
    }

    private getCustomTabProperties(tabName, state: IStoreState): IProperties {
        // short term - add appropriate logic in here to get stats for other tabs
        // long term - figure out best way for tabs to register a callback(s) here so we can get per-tab custom measurements.
        if (tabName === 'request') {
            const p1 = getRequestHeaderTelemetryProperties(state);
            const p2 = getResponseHeaderTelemetryProperties(state);
            const p3 = getMiddlewareTelemetryProperties(state);
            return {...p1, ...p2, ...p3};
        }
        else {
            return {};
        }
    }

    /**
     * get custom tab measurements for the current tab.
     */
    private getCustomTabMeasurements(tabName, state: IStoreState): IMeasurements {
        // short term - add appropriate logic in here to get stats for other tabs
        // long term - figure out best way for tabs to register a callback(s) here so we can get per-tab custom measurements.
        if (tabName === 'log') {
            const result = getLoggingTabMeasurements(state);
            return result;
        }
        else if (tabName === 'request') {
            const p1 = getRequestHeaderTelemetryMeasurements(state);
            const p2 = getResponseHeaderTelemetryMeasurements(state);
            const p3 = getMiddlewareTelemetryMeasurements(state);
            const p4 = getMiddlewareTelemetryMaxDepth(state);
            return Object.assign({}, p1, p2, p3, p4);
        }
        else if (tabName === 'timeline') {
            const props = getTimelineTabMeasurements(state);
            return props;
        }
        else if (tabName === serviceTabName) {
            const props = getServicesTabMeasurements(state);
            return props;
        }
        else {
            return {};
        }
    }

    /**
     * create redux middlware that will send telemetry for different actions
     */
    public createTelemetryMiddleware() {
        const telemetryMiddleware = store => next => action => {
            const returnValue = next(action);

            try {
                const state: IStoreState = store.getState();

                if (action.type === 'SHELL_LOADED') {
                    // telemetry sent when client UI is first opened
                    const properties = this.getShellReadyProperties();
                    const measurements = this.getShellReadyMeasurements();
                    this.queueOrSendEvent(TelemetryClient.shellReady, properties, measurements);
                }
                else if (action.type === 'REQUESTS_DETAILS_SELECTED') {
                    // telemetry sent when a request detail is selected
                    if (!this.currentTab) {
                        this.currentTab = TelemetryClient.defaultTab;
                    }

                    const { webRequest, webResponse } = action;
                    const properties = this.getRequestDetailSelectedProperties(action.requestId, this.currentRequestId, this.currentTab, this.currentTab, webRequest, webResponse, action.previousRequestValid, state);
                    let measurements = this.getRequestDetailSelectedMeasurements(this.currentTab, this.markLastRequestViewMillis(), this.markLastTabViewMillis(), webRequest, webResponse, action.previousRequestValid, state);
                    this.currentRequestId = action.requestId;
                    this.queueOrSendEvent(TelemetryClient.requestDetailSelected, properties, measurements);
                }
                else if (action.type === 'REQUESTS_DETAILS_CLOSED') {
                    // telemetry sent when a request detail is closed

                    //
                    // TODO - wire this up so the event is emitted!!!
                    //
                    const properties = this.getRequestDetailClosedProperties();
                    const measurements = this.getRequestDetailClosedMeasurements(this.markLastRequestViewMillis(), this.markLastTabViewMillis());
                    this.queueOrSendEvent(TelemetryClient.requestDetailClosed, properties, measurements);
                    this.lastRequestChangeTime = undefined;
                    this.lastTabChangeTime = undefined;
                    this.currentRequestId = undefined;
                    this.currentTab = undefined;
                }

                else if (action.type === 'REQUESTS_DETAILS_TAB_SELECTED') {

                    // telemetry sent when a tab changes in a request detail page
                    const properties = this.getRequestDetailTabChangedProperties(action.target, this.currentTab, state);
                    const measurements = this.getRequestDetailTabChangedMeasurements(this.currentTab, this.markLastTabViewMillis(), state);
                    this.queueOrSendEvent(TelemetryClient.requestDetailTabChanged, properties, measurements);
                    this.currentTab = action.target;
                }
            }
            catch (err) {
                // error sending telemetry.  Just swallow it.
                console.error(err);
            }

            return returnValue;
        };

        return telemetryMiddleware;
    }
}

let telemetryClient = new TelemetryClient();
export default telemetryClient;



// WEBPACK FOOTER //
// ./src/client/modules/telemetry/TelemetryClient.ts