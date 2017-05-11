import { combineReducers } from 'redux';
import { routerReducer as reduxRouterReducer } from 'react-router-redux';

import logSlowReducers from 'redux-log-slow-reducers';
import { persistReducerState, retrieveReducerState } from './common/util/ReducerUtilities';

import modulesReducers from './modules/ModulesReducers';
import routesReducers from './routes/RoutesReducers';
import { requestsPersistedRequestReducer } from './routes/requests/RequestsReducers';
import { themesPersistedReducer } from './shell/themes/ThemesReducer';
import { smileyFeedbackReducer } from './shell/feedback/SmileyFeedbackReducer';
import { debugSessionReducer } from './shell/debug/DebugReducer';

const stateKey = 'GlimpseAppState';

export const sessionReducer = combineReducers({
    ...modulesReducers,
    debug: debugSessionReducer,
    routing: reduxRouterReducer
});

export const persistedReducer = combineReducers({
    global: combineReducers({
        ...routesReducers,
        themes: themesPersistedReducer,
        smileyFeedback: smileyFeedbackReducer
    }),
    requests: requestsPersistedRequestReducer
});

export function buildReducers() {
    let rawReducers = {
        session: sessionReducer,
        persisted: persistReducerState(persistedReducer, stateKey)
    };

    if (DEBUG) {
        // log out slow reducers
        rawReducers = logSlowReducers(rawReducers);
    }

    return combineReducers(rawReducers);
}

export function buildInitialState() {
    return {
        session: undefined,
        persisted: retrieveReducerState(stateKey)
    };
}



// WEBPACK FOOTER //
// ./src/client/Reducers.ts