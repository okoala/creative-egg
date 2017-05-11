import { applyMiddleware, createStore, compose } from 'redux';
import { routerMiddleware } from 'react-router-redux';
import thunk from 'redux-thunk';

import { browserHistory } from './history';
import { buildReducers, buildInitialState } from './Reducers';

import telemetryClient from './modules/telemetry/TelemetryClient';
import { reportReduxException } from './modules/errors/Errors';
import { storeInitAction } from './StoreActions';

// hook up analytics
const analyticsMiddleware = telemetryClient.createTelemetryMiddleware();

// redux middleware that will report any exceptions occuring when selectors are run
const crashReporter = store => next => action => {
    try {
        return next(action);
    } catch (err) {
        reportReduxException(action.type, err);
        throw err;
    }
};

// setting up middleware
const middleware = DEBUG ?
    // tslint:disable-next-line:no-var-requires
    applyMiddleware(crashReporter, require('redux-immutable-state-invariant')(), routerMiddleware(browserHistory), thunk, analyticsMiddleware) :  // NOTE: this is slow!!!
    applyMiddleware(crashReporter, routerMiddleware(browserHistory), thunk, analyticsMiddleware);
const enhancers = DEBUG ?
    // tslint:disable-next-line:no-any
    compose(middleware, (window as any).devToolsExtension ? (window as any).devToolsExtension() : f => f) :
    middleware;

const store = createStore(buildReducers(), buildInitialState(), enhancers);

store.dispatch(storeInitAction());

export default store;



// WEBPACK FOOTER //
// ./src/client/store.ts