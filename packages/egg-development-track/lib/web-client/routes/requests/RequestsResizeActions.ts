import { createActionCreator } from 'common/actions/ActionCreator';
import { IRequestsResizeState } from './RequestsResizeInterfaces';

export const toggleOpenStateAction = createActionCreator<IRequestsResizeState>('request.controls.toggleOpenState');
export const setOpenStateAction    = createActionCreator<IRequestsResizeState>('request.controls.setOpenState');
export const setSidebarWidthAction = createActionCreator<IRequestsResizeState>('request.controls.sidebarWidth');



// WEBPACK FOOTER //
// ./src/client/routes/requests/RequestsResizeActions.ts