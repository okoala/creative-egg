import mapValues from 'lodash/mapValues';
import groupBy from 'lodash/groupBy';
import flatten from 'lodash/flatten';
import { createSelector } from 'reselect';

import { getMessageByType } from 'routes/requests/RequestsSelector';
import { getSelectedContext } from '../RequestsDetailsSelector';
import { BrowserResourceType, IBrowserResourceTimingsPayload, IBrowserResourceTiming } from 'modules/messages/schemas/IBrowserResourcePayload';

export function toResourceType(resource: IBrowserResourceTiming): string {
    return resource.initiatorType.length
        ? resource.initiatorType.toLowerCase()
        : 'other';
}

export const getBrowserResources = createSelector(
    getSelectedContext,
    selectedContext => {
        if (selectedContext) {
            return flatten(getMessageByType<IBrowserResourceTimingsPayload>(selectedContext.byType, BrowserResourceType)
                .map(message => message.payload.timings));
        }
        else {
            return [];
        }
    });

export const getBrowserResourcesByType = createSelector(
    getBrowserResources,
    browserResources => {
        return groupBy(browserResources, toResourceType);
    });

function filterInvalidValues(obj) {
    const filteredObj = { ...obj };
    for (const p in filteredObj) {
        if (!filteredObj.hasOwnProperty(p)) {
            continue;
        }
        if (isNaN(filteredObj[p])) {
            delete filteredObj[p];
        }
    }
    return filteredObj;
}

export const getBrowserResourceTypeCounts = createSelector(
    getBrowserResourcesByType,
    browserResourcesByType => {
        return filterInvalidValues(mapValues(browserResourcesByType, (resources) => resources.length));
    });

export const getBrowserResourceTypeDurations = createSelector(
    getBrowserResourcesByType,
    browserResourcesByType => {
        return filterInvalidValues(mapValues(browserResourcesByType,
            (resources) => resources.reduce((acc, resource) => acc + resource.duration, 0)));
    });

export const getBrowserResourceTypeSizes = createSelector(
    getBrowserResourcesByType,
    browserResourcesByType => {
        return filterInvalidValues(mapValues(browserResourcesByType,
            (resources) => resources.reduce((acc, resource) => acc + resource.transferSize, 0)));
    });



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/request/RequestResourceSelectors.ts