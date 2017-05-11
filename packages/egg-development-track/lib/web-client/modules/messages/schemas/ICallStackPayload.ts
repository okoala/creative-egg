/* tslint:disable-next-line:variable-name */
export const CallStackType = 'call-stack';

export interface ICallStackFrame {
    functionName: string;
    fileName?: string;
    lineNumber?: number;
    columnNumber?: number;
};

export interface ICallStackPayload {
    frames: ICallStackFrame[];
}



// WEBPACK FOOTER //
// ./src/client/modules/messages/schemas/ICallStackPayload.ts