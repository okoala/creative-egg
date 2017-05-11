import { createActionCreator } from 'common/actions/ActionCreator';
import { IRequestsFilterState } from './RequestsFilterInterfaces';

export const applyFilterStateAction = createActionCreator<IRequestsFilterState>('request.controls.applyFilterState');



// WEBPACK FOOTER //
// ./src/client/routes/requests/RequestsFilterActions.ts