/* tslint:disable-next-line:variable-name */
export const CommandAfterExecuteType = 'after-execute-command';

export interface ICommandAfterExecutePayload {
    commandHadException: boolean;
    commandEndTime: string;
    duration: number;
    commandOffset: number;
}



// WEBPACK FOOTER //
// ./src/client/modules/messages/schemas/ICommandAfterExecutePayload.ts