import { IProxy } from '../IProxy';
import tracing from '../Tracing';
import { getMessageIngressUrl } from '../../common/RequestUtilities';
import performance from '../../common/PerformanceUtilities';
import { addEvent } from '../../common/RequestUtilities';

export interface INavigationTimingCollectionEvent {
    connectEnd: number;
    connectStart: number;
    domComplete: number;
    domContentLoadedEventEnd: number;
    domContentLoadedEventStart: number;
    domInteractive: number;
    domLoading: number;
    domainLookupEnd: number;
    domainLookupStart: number;
    fetchStart: number;
    firstPaint: number;
    firstPaintDuration?: number;
    loadEventEnd: number;
    loadEventStart: number;
    navigationStart: number;
    redirectEnd: number;
    redirectStart: number;
    requestStart: number;
    responseEnd: number;
    responseStart: number;
    secureConnectionStart: number;
    unloadEventEnd: number;
    unloadEventStart: number;
}
export const EVENT_NAVIGATION_TIMING_COLLECTED = 'notify|performance.navigation-timing';

export class NavigationTimingProxy implements IProxy {
    public isSupported(): boolean {
        return !!(performance && performance.timing);
    }

    public init() {
        // setup/regiter strategy to run later
        addEvent(window, 'load', () => {
            setTimeout(() => {
                this.processTimings(performance.timing);
            });
        });
    }

    private processEntry(entry: PerformanceTiming): INavigationTimingCollectionEvent {
        // This sheds any extra properties that may be introduced to navigation
        // timing or are browser specific, and ensures the data matches our
        // interface for it.
        return {
            connectEnd: entry.connectEnd,
            connectStart: entry.connectStart,
            domComplete: entry.domComplete,
            domContentLoadedEventEnd: entry.domContentLoadedEventEnd,
            domContentLoadedEventStart: entry.domContentLoadedEventStart,
            domInteractive: entry.domInteractive,
            domLoading: entry.domLoading,
            domainLookupEnd: entry.domainLookupEnd,
            domainLookupStart: entry.domainLookupStart,
            fetchStart: entry.fetchStart,
            firstPaint: (<any>entry).firstPaint,  //tslint:disable-line:no-any
            firstPaintDuration: 0,
            loadEventEnd: entry.loadEventEnd,
            loadEventStart: entry.loadEventStart,
            navigationStart: entry.navigationStart,
            redirectEnd: entry.redirectEnd,
            redirectStart: entry.redirectStart,
            requestStart: entry.requestStart,
            responseEnd: entry.responseEnd,
            responseStart: entry.responseStart,
            secureConnectionStart: entry.secureConnectionStart,
            unloadEventEnd: entry.unloadEventEnd,
            unloadEventStart: entry.unloadEventStart
        };
    }

    private processTimings(timing: PerformanceTiming) {
        const eventData = this.processEntry(timing);

        // time to first paint
        // tslint:disable-next-line:no-any
        if ((<any>eventData).firstPaint === undefined) {
            // All times are relative times to the start time within the
            // same objects
            let firstPaint = 0;
            let firstPaintDuration = 0;

            //tslint:disable-next-line:no-any
            if ((<any>window).chrome && (<any>window).chrome.loadTimes) {
                //tslint:disable-next-line:no-any
                const loadTimes = (<any>window).chrome.loadTimes();
                firstPaint = loadTimes.firstPaintTime * 1000;
                firstPaintDuration = firstPaint - loadTimes.startLoadTime * 1000;
            } else if (typeof timing.msFirstPaint === 'number') {
                firstPaint = timing.msFirstPaint;
                firstPaintDuration = firstPaint - timing.navigationStart;
            }
            eventData.firstPaint = firstPaint;
            eventData.firstPaintDuration = firstPaintDuration;
        }

        tracing.publish(EVENT_NAVIGATION_TIMING_COLLECTED, eventData);
    }
}



// WEBPACK FOOTER //
// ./src/tracing/proxies/NavigationTimingProxy.ts