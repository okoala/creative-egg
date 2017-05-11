import { selectOperationAction, showAllAction, toggleFilterAction, tabSelectedAction } from './DataActions';

import { Action, combineReducers } from 'redux';

import values from 'lodash/values';
import mapValues from 'lodash/mapValues';

function updateSelectedOperations(state: { [key: string]: string }, selectedOperation: { requestId: string, operationId: string }) {
    const newState = {...state};

    newState[selectedOperation.requestId] = selectedOperation.operationId;

    return newState;
}

export function selectedOperationsReducer(state: { [key: string]: string } = {}, action: Action) {
    switch (action.type) {
        case selectOperationAction.type:
            return updateSelectedOperations(state, selectOperationAction.unwrap(action));
        default:
            return state;
    }
}

function toggleFilter(state: { [key: string]: boolean }, name: string): { [key: string]: boolean } {
    const currentValue = state[name];
    const newValue = currentValue !== undefined ? !currentValue : false;

    const newState = {...state};

    newState[name] = newValue;

    return newState;
}

function showAllFilters(state: { [key: string]: boolean }): { [key: string]: boolean } {
    if (values(state).some(filter => !filter)) {
        return mapValues(state, filter => true);
    }
    else {
        return state;
    }
}

export function filtersReducer(state: { [key: string]: boolean } = {}, action: Action) {
    switch (action.type) {
        case toggleFilterAction.type:
            return toggleFilter(state, toggleFilterAction.unwrap(action));
        case showAllAction.type:
            return showAllFilters(state);
        default:
            return state;
    }
}

export function selectedTabReducer(state: string = 'general', action: Action) {
    switch (action.type) {
        case tabSelectedAction.type:
            return tabSelectedAction.unwrap(action);
        default:
            return state;
    }
}

/**
 * The reducer for the persisted, non-request-specific data state
 */
export const dataPersistedReducer = combineReducers({
    filters: filtersReducer,
    selectedOperations: selectedOperationsReducer,
    selectedTab: selectedTabReducer
});



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/data/DataReducers.ts