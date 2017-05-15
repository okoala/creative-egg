'use strict';

import { ErrorCode, getUrlForErrorCode } from './ErrorCodes';
import { IGlimpseError, GlimpseErrorClass, GlimpseErrorSeverity } from './IGlimpseError';
import { outside } from 'semver';

export function createNoContextError(): IGlimpseError {
  return {
    severity: GlimpseErrorSeverity.Error,
    errorClass: GlimpseErrorClass.Internal,
    errorCode: ErrorCode.NoContext,
    message: 'Glimpse was unable to retrieve the context associated with a request at location %s'
  };
}

export function createUnexpectedContextError(): IGlimpseError {
  return {
    severity: GlimpseErrorSeverity.Error,
    errorClass: GlimpseErrorClass.Internal,
    errorCode: ErrorCode.UnexpectedContextValue,
    message: 'Glimpse unexpected context value at location %s.  Expecting context ID %s.  Actual context ID is %s'
  };
}

export function createPackageRequiredBeforeInitError(packageName: string): IGlimpseError {
  return {
    severity: GlimpseErrorSeverity.Error,
    errorClass: GlimpseErrorClass.User,
    errorCode: ErrorCode.PackageRequiredBeforeInit,
    message: `
      The package '${packageName}' was imported before Glimpse was initialized.
      Glimpse may not capture data related to that package.
    `,
  };
}

export function createUnsupportedPackageRequiredError(
  packageName: string,
  requiredVersion: string,
  supportedRange: string,
): IGlimpseError {

  // We check if an older version than we support was required, or a newer one,
  // and set the severity and error code appropriately
  if (outside(requiredVersion, supportedRange, '>')) { // Newer
    return {
      severity: GlimpseErrorSeverity.Error,
      errorClass: GlimpseErrorClass.User,
      errorCode: ErrorCode.NewerUnsupportedPackageRequired,
      message: `
        Glimpse does not support version ${requiredVersion} of ${packageName} yet.
        You can get rich insights into ${packageName} by downgrading to a supported version,
        as covered at ${getUrlForErrorCode(ErrorCode.NewerUnsupportedPackageRequired)}.
      `,
    };
  }
  // Older
  return {
    severity: GlimpseErrorSeverity.Warning,
    errorClass: GlimpseErrorClass.User,
    errorCode: ErrorCode.OlderUnsupportedPackageRequired,
    message: `
      Glimpse does not support version ${requiredVersion} of ${packageName}.
      You can get rich insights into ${packageName} by upgrading to a supported version,
      as covered at ${getUrlForErrorCode(ErrorCode.OlderUnsupportedPackageRequired)}.
    `,
  };
}

export function createHttpClientError(err: Error | string): IGlimpseError {
  return {
    severity: GlimpseErrorSeverity.Warning,
    errorClass: GlimpseErrorClass.User,
    errorCode: ErrorCode.HttpClientError,
    message: `
      A client HTTP request has errored,
      which will prevent this request from showing up in the Glimpse UI: ${err}
    `,
  };
}

export function createHttpServerError(err: Error | string): IGlimpseError {
  return {
    severity: GlimpseErrorSeverity.Warning,
    errorClass: GlimpseErrorClass.User,
    errorCode: ErrorCode.HttpServerError,
    message: `
      A server HTTP request has errored which,
      will prevent this request from showing up in the Glimpse UI: ${err}
    `,
  };
}

export function createHttpServerEarlyRequestTerminationError(requestUrl: string): IGlimpseError {
  return {
    severity: GlimpseErrorSeverity.Warning,
    errorClass: GlimpseErrorClass.User,
    errorCode: ErrorCode.HttpServerEarlyRequestTerminationError,
    message: `
      A server HTTP response for request URL ${requestUrl} was ended before the request was completed,
      which may prevent body information from showing up in the Glimpse UI
    `,
  };
}

export function createAuthorizationInvocationFailedError(err: Error): IGlimpseError {
  return {
    severity: GlimpseErrorSeverity.Error,
    errorClass: GlimpseErrorClass.User,
    errorCode: ErrorCode.AuthorizationInvocationFailed,
    message: `A server authorization invocation failed with error: ${err}`,
  };
}

export function createStackHelperUnsupportedSourceMapUriError(uri: string) {
  return {
    severity: GlimpseErrorSeverity.Error,
    errorClass: GlimpseErrorClass.Internal,
    errorCode: ErrorCode.StackHelperUnsupportedSourceMapUri,
    message: `Unsupported source map URI format found:  ${uri}`,
  };
}

export function createStackHelperUnsupportedStackFrameFormat(stackFrame: string) {
  return {
    severity: GlimpseErrorSeverity.Error,
    errorClass: GlimpseErrorClass.Internal,
    errorCode: ErrorCode.StackHelperUnsupportedStackFrameFormat,
    message: `Unsupported stack frame format found:  ${stackFrame}`,
  };
}

export function createAsyncTrackError(msg: string): IGlimpseError {
  return {
    severity: GlimpseErrorSeverity.Error,
    errorClass: GlimpseErrorClass.Internal,
    errorCode: ErrorCode.AsyncTrackError,
    message: `AsyncTrack error reported: ${msg}`,
  };
}

export function createAsyncTrackWarning(msg: string): IGlimpseError {
  return {
    severity: GlimpseErrorSeverity.Warning,
    errorClass: GlimpseErrorClass.Internal,
    errorCode: ErrorCode.AsyncTrackWarning,
    message: `AsyncTrack warning reported: ${msg}`,
  };
}
