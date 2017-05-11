import { REQUESTS_DETAILS_TAB_SELECTED } from './requests-details-constants';

import { combineReducers } from 'redux';

import { dataPersistedReducer } from './data/DataReducers';
import { requestResponseTabStripPersistedReducer } from './components/request-response-tab-strip/requests-details-request-response-tab-strip-reducer';
import { servicePersistedReducer, servicePersistedRequestReducer } from './service/ServiceReducers';
import { loggingPersistedReducer } from './logging/LoggingReducers';
import { timelinePersistedReducer, timelinePersistedRequestReducer } from './timeline/TimelineReducers';

const initialState = {
    tab: 'request'
};

function route(state = initialState, action) {
    if (action.type === REQUESTS_DETAILS_TAB_SELECTED) {
        return {
            tab: action.target
        };
    }
    return state;
}

/**
 * The reducer for the persisted, non-request-specific state related to the request details panel
 */
export const detailsPersistedReducer = combineReducers({
    data: dataPersistedReducer,
    route,
    requestResponseTabStrip: requestResponseTabStripPersistedReducer,
    service: servicePersistedReducer,
    logging: loggingPersistedReducer,
    timeline: timelinePersistedReducer
});

/**
 * The reducer for the persisted, request-specific state related to the request details panel
 */
export const detailsPersistedRequestReducer = combineReducers({
    service: servicePersistedRequestReducer,
    timeline: timelinePersistedRequestReducer
});



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/requests-details-reducer.ts