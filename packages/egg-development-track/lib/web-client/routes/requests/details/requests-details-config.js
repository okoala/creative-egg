import RequestsDetailsView from './views/RequestsDetails';

import loggingConfig from './logging/requests-details-logging-config';
import dataConfig from './data/DataConfig';
import requestConfig from './request/RequestConfig';
import serviceConfig from './service/ServiceConfig';
import timelineConfig from './timeline/TimelineConfig';
import debugConfig from './debug/DebugConfig';

import { processRoutes, processTabs } from 'common/config/config-processor';
import { tabSelected, requestSelected } from './requests-details-actions';
import { getFilteredRequests } from '../RequestsFilterSelectors';
import { isExperimentalMode } from 'common/util/ConfigurationUtilities';

const childConfigs = [ requestConfig, timelineConfig, loggingConfig, serviceConfig ];
if (isExperimentalMode()) {
    childConfigs.push(dataConfig);
}
if (DEBUG) {
    childConfigs.push(debugConfig);
}

const tabData = processTabs(childConfigs);

let previousSelectedTab = '';
let previousSelectedRequestId = '';

export default {
    getTabData() {
        return tabData;
    },
    getRoute(store) {
        const templateRoute = {
            onEnter() {
                const tab = this.path;
                if (previousSelectedTab != tab) {
                    // set which tab has been selected
                    store.dispatch(tabSelected(tab, previousSelectedTab));

                    previousSelectedTab = tab;
                }
            }
        };
        const childRoutes = processRoutes(childConfigs, templateRoute, store);

        return {
            path: ':requestId',
            component: RequestsDetailsView,
            childRoutes: childRoutes,
            onEnter(nextState) {
                const requestId = nextState.params.requestId;
                if (previousSelectedRequestId !== requestId) {
                    const filteredRequests = getFilteredRequests(store.getState());

                    // get data for the selected request
                    const request = filteredRequests.byId[requestId];
                    const webRequest = (request && request.webRequest) || undefined;
                    const webResponse = (request && request.webResponse) || undefined;

                    const previousRequests = filteredRequests.byId[previousSelectedRequestId];
                    const previousRequestValid = !!previousRequests;

                    store.dispatch(requestSelected(requestId, previousSelectedRequestId, webRequest, webResponse, previousRequestValid));

                    previousSelectedRequestId = requestId;
                }
            },
            indexRoute: {
                onEnter: (nextState, replace) => {
                    // get previously selected tab and redirect to that tab
                    const detailAxis = store.getState().persisted.global.requests.details.route.tab;
                    replace(`/requests/${nextState.params.requestId}/${detailAxis}`);
                }
            }
        };
    }
};



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/requests-details-config.js