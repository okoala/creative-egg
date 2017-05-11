import { Action } from 'redux';
import { IServiceResizePersistedState } from './ServiceInterfaces';

import {
    toggleResizeOpenAction,
    setResizeOpenAction,
    setResizeHeightAction
} from './ServiceActions';

import { SIDEBAR_NORMAL_HEIGHT } from './ServiceConstants';

const toggleOpenState = (state: IServiceResizePersistedState): IServiceResizePersistedState => {
    return {...state, isOpen: !state.isOpen };
};

const setOpenState = (state: IServiceResizePersistedState, action): IServiceResizePersistedState => {
    return {...state, isOpen: action.isOpen };
};

const setHeight = (state: IServiceResizePersistedState, action): IServiceResizePersistedState => {
    return {...state, height: action.height};
};

export const initialState: IServiceResizePersistedState = {
    isOpen: true,
    height: SIDEBAR_NORMAL_HEIGHT
};

export default function resizeReducer(state: IServiceResizePersistedState = initialState, action: Action) {
    switch (action.type) {
        case toggleResizeOpenAction.type:
            return toggleOpenState(state);
        case setResizeOpenAction.type:
            return setOpenState(state, setResizeOpenAction.unwrap(action));
        case setResizeHeightAction.type:
            return setHeight(state, setResizeHeightAction.unwrap(action));
        default:
            return state;
    }
}



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/service/ServiceResizeReducer.ts