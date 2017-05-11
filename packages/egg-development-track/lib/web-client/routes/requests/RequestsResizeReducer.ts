import { Action } from 'redux';
import { IRequestsResizeState } from './RequestsResizeInterfaces';
import {
    setSidebarWidthAction,
    toggleOpenStateAction,
    setOpenStateAction
} from './RequestsResizeActions';

export const initialState: IRequestsResizeState = {
    sidebarWidth: 300,
    isOpen: true
};

const toggleOpenState = (state: IRequestsResizeState): IRequestsResizeState => {
    return {...state, isOpen: !state.isOpen };
};

const setOpenState = (state: IRequestsResizeState, action): IRequestsResizeState => {
    return {...state, isOpen: action.isOpen };
};

const setWidth = (state: IRequestsResizeState, action): IRequestsResizeState => {
    return {...state, sidebarWidth: action.sidebarWidth};
};

export default function requestsViewResizeReducer(state: IRequestsResizeState = initialState, action: Action): IRequestsResizeState {
    switch (action.type) {
        case toggleOpenStateAction.type:
            return toggleOpenState(state);
        case setOpenStateAction.type:
            return setOpenState(state, setOpenStateAction.unwrap(action));
        case setSidebarWidthAction.type:
            return setWidth(state, setSidebarWidthAction.unwrap(action));
        default:
            return state;
    }
};



// WEBPACK FOOTER //
// ./src/client/routes/requests/RequestsResizeReducer.ts