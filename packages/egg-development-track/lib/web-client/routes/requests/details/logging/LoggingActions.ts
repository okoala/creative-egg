import { createActionCreator, createSimpleActionCreator } from 'common/actions/ActionCreator';

export const showAllActionID = 'request.detail.logging.showAll';
export const toggleLevelActionID = 'request.detail.logging.toggleLevel';
export const toggleAgentActionID = 'request.detail.logging.toggleAgent';

export const showAllAction = createSimpleActionCreator(showAllActionID);
export const toggleLevelAction = createActionCreator<number>(toggleLevelActionID);
export const toggleAgentAction = createActionCreator<number>(toggleAgentActionID);



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/logging/LoggingActions.ts