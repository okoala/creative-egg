import { IProxy } from '../IProxy';
import tracing from '../Tracing';
import { getMessageIngressUrl } from '../../common/RequestUtilities';
import performance from '../../common/PerformanceUtilities';

const UPDATE_INTERVAL = 1000;

/**
 * @property {string} name - The fully resolved URL of the resource
 * @property {number} startTime - The amount of time that has elapsed since the
 *      time origin of the browser, typically page load
 * @property {number} duration - The amount of time it took to fetch the resource
 * @property {string} initiatorType - The type of resource, e.g. 'css', 'img', etc.
 * @property {string} nextHopProtocol - The protocol used by the browser to fetch
 *      the resource, e.g. 'HTTP/1'
 * @property {number} redirectStart - The timestamp of the start of a redirect
 * @property {number} redirectEnd - The timestamp of the end of a redirect
 * @property {number} fetchStart - The timestamp of the start of a fetch request
 * @property {number} domainLookupStart - The timestamp of the start of a DNS lookup
 * @property {number} domainLookupEnd - The timestamp of the end of a DNS lookup
 * @property {number} connectStart - The timestamp of the start of a TCP connection
 *      being made
 * @property {number} connectEnd - The timestamp of the end of a TCP connection
 *      being made
 * @property {number} secureConnectionStart - The timestamp of the start of a
 *      secure TLS connection being made
 * @property {number} requestStart - The timestamp of the start the HTTP request
 * @property {number} responseStart - The timestamp of the start the HTTP response
 * @property {number} responseEnd - The timestamp of the end the HTTP response
 * @property {number} transferSize - The size of the entire response, including headers, body, etc.
 * @property {number} encodedBodySize - The size of the response body before decoding, e.g. gzipped size
 * @Property {number} decodedBodySize - The size of the response body after decoding
 */
export interface IResourceTimingCollectionEvent {
    name: string;
    startTime: number;
    duration: number;
    initiatorType: string;
    nextHopProtocol: string;
    redirectStart: number;
    redirectEnd: number;
    fetchStart: number;
    domainLookupStart: number;
    domainLookupEnd: number;
    connectStart: number;
    connectEnd: number;
    secureConnectionStart: number;
    requestStart: number;
    responseStart: number;
    responseEnd: number;
    transferSize: number;
    encodedBodySize: number;
    decodedBodySize: number;
}
export const EVENT_RESOURCE_TIMING_COLLECTED = 'notify|performance.resource-collected';

export class ResourceTimingProxy implements IProxy {
    public isSupported(): boolean {
        // Don't initialize if this browser doesn't support resource timing
        return !!(performance && performance.getEntriesByType);
    }

    public init() {
        function processEntry(entry): IResourceTimingCollectionEvent {
            // This sheds any extra properties that may be introduced to resource timing
            // or are browser specific, and ensures the data matches our interface for it.
            return {
                name: entry.name,
                startTime: entry.startTime,
                duration: entry.duration,
                initiatorType: entry.initiatorType,
                nextHopProtocol: entry.nextHopProtocol,
                redirectStart: entry.redirectStart,
                redirectEnd: entry.redirectEnd,
                fetchStart: entry.fetchStart,
                domainLookupStart: entry.domainLookupStart,
                domainLookupEnd: entry.domainLookupEnd,
                connectStart: entry.connectStart,
                connectEnd: entry.connectEnd,
                secureConnectionStart: entry.secureConnectionStart,
                requestStart: entry.requestStart,
                responseStart: entry.responseStart,
                responseEnd: entry.responseEnd,
                transferSize: entry.transferSize,
                encodedBodySize: entry.encodedBodySize,
                decodedBodySize: entry.decodedBodySize
            };
        }

        // Eventually we want to switch to using Performance Observers once browsers
        // start to implement, but currently none do, so we poll for entries instead
        // https://w3c.github.io/performance-timeline/#dom-performanceobserver
        const reportedEntries = {};
        function record() {
            const resources = performance.getEntriesByType('resource');
            const entriesToPublish = [];
            const ingressUrl = getMessageIngressUrl();
            for (const resource of resources) {
                // Create a unique id for the entry, a combination of the start time
                // and resolved URL
                const id = `${resource.startTime}#${resource.name}`;
                if (!reportedEntries[id] && resource.name.indexOf(ingressUrl) === -1) {
                    reportedEntries[id] = true;
                    entriesToPublish.push(processEntry(resource));
                }
            }
            if (entriesToPublish.length) {
                tracing.publish(EVENT_RESOURCE_TIMING_COLLECTED, entriesToPublish);
            }
            setTimeout(record, UPDATE_INTERVAL);
        };
        record();
    }
}



// WEBPACK FOOTER //
// ./src/tracing/proxies/ResourceTimingProxy.ts