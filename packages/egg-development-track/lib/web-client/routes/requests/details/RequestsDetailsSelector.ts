import { createSelector } from 'reselect';

import { IStoreState } from 'client/IStoreState';
import { IContext, IRequest } from '../RequestsInterfaces';
import { getSelectedContextId, getByContextId } from '../RequestsSelector';
import { getRequestsLookup } from '../RequestsSelector';
import { IWebResponsePayload } from 'client/modules/messages/schemas/IWebResponsePayload';
import { IBrowserNavigationTimingPayload } from 'client/modules/messages/schemas/IBrowserNavigationTimingPayload';

export const getSelectedContext: (state: IStoreState) => IContext = createSelector(
    getSelectedContextId,
    getByContextId,
    (selectedContextId, byContextId) => byContextId[selectedContextId]);

export const getSelectedRequest: (state: IStoreState) => IRequest = createSelector(
    getSelectedContextId,
    getRequestsLookup,
    (selectedContextId, requests) => requests.byId[selectedContextId]);

export function calculateDuration(webResponse: IWebResponsePayload, browserNavigationTiming: IBrowserNavigationTimingPayload) {
    const serverDuration = webResponse.duration;

    if (browserNavigationTiming) {
        const { loadEventEnd, navigationStart } = browserNavigationTiming;
        const browserDuration = loadEventEnd - navigationStart;

        return loadEventEnd <= 0 || navigationStart <= 0 ? serverDuration : browserDuration;
    }

    return serverDuration;
}



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/RequestsDetailsSelector.ts