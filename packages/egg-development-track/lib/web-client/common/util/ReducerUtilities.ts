import debounce from 'lodash/debounce';
import { Dispatch } from 'redux';

/**
 * Ensures that reducer state is persisted to local storage as required
 * @param reducer whos results are being saved
 * @param key that should be used in local storage
 */
export function persistReducerState(reducer: (state: {}, action: {}) => {}, key: string, wait = 2000, maxWait = 2000) {
    const slowSaveState = debounce(saveState, wait, { maxWait });

    function saveState(state: {}) {
        console.log('[STATE] Saveing state');
        console.time('[PERF:STATE] ReducerUtilities.persistReducerState'); // tslint:disable-line:no-console
        try {
            localStorage.setItem(key, JSON.stringify(state));
        }
        catch (e) {
            console.error('[STATE] Could not persist state: ', e);
        }
        console.timeEnd('[PERF:STATE] ReducerUtilities.persistReducerState'); // tslint:disable-line:no-console
    }

    return (state: {}, action: {}) => {
        const newState = reducer(state, action);
        if (state !== newState) {
            slowSaveState(newState);
        }

        return newState;
    };
}

/**
 * Reteive state from local storage given a key
 * @param key that should be used in targetting local storage
 */
export function retrieveReducerState(key: string, defaultState?: any): {} { // tslint:disable-line:no-any
    console.log('[STATE] Retrieving state');
    console.time('[PERF:STATE] ReducerUtilities.retrieveReducerState'); // tslint:disable-line:no-console
    let result = defaultState;
    try {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
            result = JSON.parse(storedValue);
        }
    }
    catch (e) {
        console.error('[STATE] Could not retrieve state: ', e);
    }
    console.timeEnd('[PERF:STATE] ReducerUtilities.retrieveReducerState'); // tslint:disable-line:no-console

    return result;
}

export interface IPurgeableRecord {
    [key: string]: {
        /**
         * The millisecond timestamp for when this state was last updated
         */
        updated: number;
    };
}

/**
 * Removes reconds that don't meet the cutoff time
 * @param records that should be purged
 * @param cutoffAmount amount by which records will be removed if thye haven't been updated
 */
export function purgeOldRecords<T>(records: T & IPurgeableRecord, cutoffAmount = 1000 * 60 * 60 * 24 * 1): T {
    const currentCutoffTime = new Date().getTime() - cutoffAmount;

    console.log('[STATE] Checking if old records should be removed');
    const result = {} as T & IPurgeableRecord;
    for (const key in records) {
        // only keep records that are greater than the cutoff
        if (records[key].updated > currentCutoffTime) {
            result[key] = records[key];
        }
        else {
            console.log('[STATE] Removing old record: ', records[key]);
        }
    }
    console.log('[STATE] Finished checking if old records should be removed, checked -', Object.keys(records).length);

    return result;
}

function triggerPurgeOldRecords(action: () => any, dispatcher: Dispatch<any>, delay: number) { // tslint:disable-line:no-any
    dispatcher(action());

    setTimeout(() => triggerPurgeOldRecords(action, dispatcher, delay), delay);
}

/**
 * Setup trigger which will purge old records that aren't needed any longer
 * @param action to be triggered when purge should occur
 * @param dispatcher instance
 * @param intialDelay from when the initial purge will occur
 * @param followupDelay time to follow up purges post intial occurance
 */
export function setupPurgeOldRecords(action: () => any, dispatcher: Dispatch<any>, intialDelay = 10000, followupDelay = 1000 * 60 * 60 * 6) { // tslint:disable-line:no-any
    setTimeout(() => triggerPurgeOldRecords(action, dispatcher, followupDelay), intialDelay);
}



// WEBPACK FOOTER //
// ./src/client/common/util/ReducerUtilities.ts