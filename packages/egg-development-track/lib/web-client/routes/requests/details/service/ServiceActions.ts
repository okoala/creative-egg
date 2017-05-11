import { createActionCreator, createRequestPersistedActionCreator, createSimpleActionCreator } from 'common/actions/ActionCreator';

export const selectExchangeAction = createRequestPersistedActionCreator<{ requestId: string, exchangeId: string }>('request.detail.service.selectExchange');

export const toggleStatusCodeClassActionID = 'request.detail.service.toggleStatusCodeClass';
export const toggleAgentActionID = 'request.detail.service.toggleAgent';
export const resetAllActionID = 'request.detail.service.resetAll';

export const resetAllAction = createSimpleActionCreator(resetAllActionID);
export const toggleStatusCodeClassAction = createActionCreator<number>(toggleStatusCodeClassActionID);
export const toggleAgentAction = createActionCreator<number>(toggleAgentActionID);

// resize control
const toggleResizeOpenID = 'request.detail.service.resize.toggleOpen';
const setResizeOpenID = 'request.detail.service.resize.setOpen';
const setResizeHeightID = 'request.detail.service.resize.setHeight';

export const toggleResizeOpenAction = createSimpleActionCreator(toggleResizeOpenID);
export const setResizeOpenAction = createActionCreator(setResizeOpenID);
export const setResizeHeightAction = createActionCreator(setResizeHeightID);



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/service/ServiceActions.ts