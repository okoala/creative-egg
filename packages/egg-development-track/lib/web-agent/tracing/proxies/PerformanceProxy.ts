import { IProxy } from '../IProxy';
import tracing from '../Tracing';
import performance from '../../common/PerformanceUtilities';
import { getGuid } from '../../common/GeneralUtilities';

/**
 * This event indicates that `performance.mark()` was called.
 *
 * @property {string} id - a globally unique identifier
 * @property {string} name - The name of the mark
 * @property {string} startTime - The start time of the mark, as indicated by
 *      by a call to `performance.getEntriesByName(name)
 * @property {boolean} isBuiltIn - Whether or not this mark was explicitly
 *      created by the user, or if it was generated automatically by the browser
 */
export interface IPerformanceMarkEvent {
    id: string;
    name: string;
    startTime: number;
    isBuiltIn: boolean;
}
export const EVENT_PERFORMANCE_MARK = 'invoke|post|performance.mark';

/**
 * This event indicates that `performance.measure()` was called. The mark entries
 * supplied with this event are normalized. If a mark event is an "implicit" event,
 * e.g. it came from `performance.timing` instead of `performance.mark()`, then
 * a synthetic IPerformanceMarkEvent is created to represent it.
 *
 * @property {string} name - The name of the measure
 * @property {number} startTime - The time that measure was called
 * @property {object} startMark - The start mark event
 * @property {object} endMark - The end mark event
 */
export interface IPerformanceMeasureEvent {
    name: string;
    startMarkId: string;
    endMarkId: string;
}
export const EVENT_PERFORMANCE_MEASURE = 'invoke|post|performance.measure';

let measureIdCount = 1;

interface IPerformanceEntry {
    name: string;
    entryType: string;
    startTime: number;
    duration: number;
}

export class PerformanceProxy implements IProxy {
    private markIdCache: { [ name: string ]: string } = {};

    private oldMeasure: (name: string, start: string, end: string) => void;

    private getMarkId(name: string): string {

        // Check if we have a cached mark entry, and if so, return it
        if (this.markIdCache[name]) {
            return this.markIdCache[name];
        }

        // If we got here, then that means there is not a cached mark entry,
        // meaning we haven't seen the mark before. This can happen for two reasons:
        // 1) The name is not a known mark name. Technically it shouldn't ever
        //    get to this method, because `performance.measure` will throw first
        // 2) The name is a built-in performance timing mark that the browser
        //    generated on page load. These are stored in `performance.timing`

        // This checks if we have a built-in `performance.timing` mark. If
        // we do have a built in `performance.timing` mark, we create a mark
        // message for this retroactively and publish a mark event. Note:
        // if this built in mark was already referenced, it will be in the
        // cache, meaning that this code will not be run twice for the same mark
        if (performance.timing[name]) {

            // We do a little hack here to get the `startTime` of the entry
            // by measuring this mark against itself and getting the
            // resulting performance entry
            const tempMeasureName = `__glimpse_measure-${measureIdCount++}`;
            this.oldMeasure.call(performance, tempMeasureName, name, name);
            const tempMeasureEntry = this.getPerformanceEntryByName(tempMeasureName);

            const eventData = this.initializeMark(name, tempMeasureEntry.startTime, true);

            // We clear the measure entry now so we can keep the `performance.getEntries`
            // history clean for users who want to query performance entries
            performance.clearMeasures(tempMeasureName);

            tracing.publish(EVENT_PERFORMANCE_MARK, eventData);
            return eventData.id;
        }

        // If we got here, then it means the mark name is not valid. We _shouldn't_
        // ever get here, because the browser's native `performance.measure` method
        // will throw if the name is not know before this method is called.
        return undefined;
    }

    private getPerformanceEntryByName(name: string): IPerformanceEntry {
        return performance.getEntriesByName(name).pop();
    }

    private initializeMark(name: string, startTime: number, isBuiltIn: boolean): IPerformanceMarkEvent {
        const id = getGuid();
        const eventData: IPerformanceMarkEvent = {
            id,
            name,
            startTime,
            isBuiltIn
        };

        // We only need to store the newest ID in the cache because `performance.measure`
        // always grabs the newest mark with a given name. For more info, see
        // https://www.w3.org/TR/user-timing/#dom-performance-measure
        this.markIdCache[name] = id;
        return eventData;
    }

    private instrumentMark() {
        const oldMark = performance.mark;
        const self = this;
        performance.mark = function mark(name, ...args) {
            oldMark.call(this, name, ...args);
            const performanceEntry = self.getPerformanceEntryByName(name);
            const eventData = self.initializeMark(performanceEntry.name, performanceEntry.startTime, false);
            tracing.publish(EVENT_PERFORMANCE_MARK, eventData);
        };
    }

    private instrumentMeasure() {
        this.oldMeasure = performance.measure;
        const self = this;
        performance.measure = function measure(name, startMark, endMark, ...args) {
            self.oldMeasure.call(this, name, startMark, endMark, ...args);
            const startMarkId = self.getMarkId(startMark);
            const endMarkId = self.getMarkId(endMark);
            if (startMarkId && endMarkId) {
                const eventData: IPerformanceMeasureEvent = {
                    name,
                    startMarkId,
                    endMarkId
                };
                tracing.publish(EVENT_PERFORMANCE_MEASURE, eventData);
            }
        };
    }

    public isSupported(): boolean {
        return !!(performance && performance.getEntriesByName);
    }

    public init() {
        if (performance.mark) {
            this.instrumentMark();
        }
        if (performance.measure) {
            this.instrumentMeasure();
        }
    }
}



// WEBPACK FOOTER //
// ./src/tracing/proxies/PerformanceProxy.ts