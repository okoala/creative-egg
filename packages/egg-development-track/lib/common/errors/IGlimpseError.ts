'use strict';

import { ErrorCode } from './ErrorCodes';

export enum GlimpseErrorSeverity {
    Error = 3,
    Warning = 4,
    Info = 6
}

export enum GlimpseErrorClass {
    User,
    Internal
}

export interface IGlimpseError {
    severity: GlimpseErrorSeverity;
    errorClass: GlimpseErrorClass;
    errorCode: ErrorCode;
    message: string;
}
