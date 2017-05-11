/* tslint:disable-next-line:variable-name */
export const BrowserNavigationTimingType = 'browser-navigation-timing';

export interface IBrowserNavigationTimingPayload {
    firstPaintDuration: number;
    firstPaint: number;
    loadDuration: number;
    domReadyDuration: number;
    readyStart: number;
    redirectDuration: number;
    appcacheDuration: number;
    unloadEventDuration: number;
    lookupDomainDuration: number;
    connectDuration: number;
    requestDuration: number;
    initDomTreeDuration: number;
    loadEventDuration: number;
    networkRequestDuration: number;
    networkResponseDuration: number;
    networkDuration: number;
    serverDuration: number;
    browserDuration: number;
    totalDuration: number;

    // these events come from the performance timing spec.  see https://www.w3.org/TR/navigation-timing/
    navigationStart?: number;
    unloadEventStart?: number;
    unloadEventEnd?: number;
    redirectStart?: number;
    redirectEnd?: number;
    fetchStart?: number;
    domainLookupStart?: number;
    domainLookupEnd?: number;
    connectStart?: number;
    connectEnd?: number;
    secureConnectionStart?: number;
    requestStart?: number;
    responseStart?: number;
    responseEnd?: number;
    domLoading?: number;
    domInteractive?: number;
    domContentLoadedEventStart?: number;
    domContentLoadedEventEnd?: number;
    domComplete?: number;
    loadEventStart?: number;
    loadEventEnd?: number;
};



// WEBPACK FOOTER //
// ./src/client/modules/messages/schemas/IBrowserNavigationTimingPayload.ts