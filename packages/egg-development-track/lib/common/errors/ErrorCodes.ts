'use strict';

/**
 * Gets a slug for the given error code
 */
export function getSlugForErrorCode(errorCode: ErrorCode): string {
    return ErrorCode[errorCode];
}

/**
 * Get's a fully qualified URL for the given slug. Currently, this returns the location
 * on the Home repo's README, but will be modified once the main website is live for the
 * new version of Glimpse
 *
 * @parameter {string} slug - The slug to get the URL for, e.g. "package--version-support"
 * @return {string} The fully qualified URL for the slug
 */
export function getUrlForErrorCode(errorCode: ErrorCode): string {
    switch (errorCode) {
        case ErrorCode.NewerUnsupportedPackageRequired:
        case ErrorCode.OlderUnsupportedPackageRequired:
            return 'https://github.com/Glimpse/Home#package--version-support';
        default:
            return 'https://github.com/Glimpse/Home';
    }
}

export enum ErrorCode {
    // Agent Errors
    GlimpseAgentErrorBase = 1000,
    NoContext = 1001,
    UnexpectedContextValue = 1002,
    PackageRequiredBeforeInit = 1003,
    OlderUnsupportedPackageRequired = 1004,
    NewerUnsupportedPackageRequired = 1005,
    HttpClientError = 1006,
    HttpServerError = 1007,
    StackHelperUnsupportedSourceMapUri = 1008,
    StackHelperUnsupportedStackFrameFormat = 1009,
    HttpServerEarlyRequestTerminationError = 1010,
    AsyncTrackError = 1011,
    AsyncTrackWarning = 1012,

    // Server Errors
    GlimpseServerErrorBase = 5000,
    AuthorizationInvocationFailed = 5001
}
