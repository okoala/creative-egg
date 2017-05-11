/* tslint:disable-next-line:variable-name */
export const CommandBeforeExecuteType = 'before-execute-command';

export interface ICommandBeforeExecutePayload {
    commandMethod: string;
    commandIsAsync: boolean;
    commandText: string;
    commandType: string;
}



// WEBPACK FOOTER //
// ./src/client/modules/messages/schemas/ICommandBeforeExecutePayload.ts