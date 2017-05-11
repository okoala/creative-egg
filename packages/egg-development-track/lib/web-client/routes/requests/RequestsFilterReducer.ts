import { Action } from 'redux';

import { IRequestsFilterState } from './RequestsFilterInterfaces';
import { applyFilterStateAction } from './RequestsFilterActions';
import { ContentTypeClass } from 'common/util/ContentTypes';

export const initialState: IRequestsFilterState = {
    method: {},
    status: {},
    contentTypeClass: ContentTypeClass.Data | ContentTypeClass.Document // tslint:disable-line:no-bitwise
};

const applyFilterState = (state: IRequestsFilterState): IRequestsFilterState => {
    return state;
};

export default function requestsViewResizeReducer(state: IRequestsFilterState = initialState, action: Action): IRequestsFilterState {
    switch (action.type) {
        case applyFilterStateAction.type:
            return applyFilterState(applyFilterStateAction.unwrap(action));
        default:
            return state;
    }
};



// WEBPACK FOOTER //
// ./src/client/routes/requests/RequestsFilterReducer.ts