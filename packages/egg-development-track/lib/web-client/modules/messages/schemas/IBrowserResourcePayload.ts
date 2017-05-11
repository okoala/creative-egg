/* tslint:disable-next-line:variable-name */
export const BrowserResourceType = 'browser-resource';

export interface IBrowserResourceTiming {
    name: string;
    startTime: number;
    duration: number;
    initiatorType: string;
    nextHopProtocol?: string;
    redirectStart?: number;
    redirectEnd?: number;
    fetchStart: number;
    domainLookupStart: number;
    domainLookupEnd: number;
    connectStart: number;
    connectEnd: number;
    secureConnectionStart?: number;
    requestStart: number;
    responseStart: number;
    responseEnd: number;
    transferSize?: number;
    encodedBodySize?: number;
    decodedBodySize?: number;
}

export interface IBrowserResourceTimingsPayload {
    timings: IBrowserResourceTiming[];
}



// WEBPACK FOOTER //
// ./src/client/modules/messages/schemas/IBrowserResourcePayload.ts