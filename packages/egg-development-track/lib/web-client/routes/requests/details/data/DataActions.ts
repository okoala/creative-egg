import { createActionCreator, createSimpleActionCreator } from 'common/actions/ActionCreator';

export const selectOperationAction = createActionCreator<{ requestId: string, operationId: string }>('request.detail.data.select');

export const toggleFilterAction = createActionCreator<string>('request.detail.data.toggle');

export const showAllAction = createSimpleActionCreator('request.detail.data.all');

export const tabSelectedAction = createActionCreator<string>('request.detail.data.tab');



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/data/DataActions.ts