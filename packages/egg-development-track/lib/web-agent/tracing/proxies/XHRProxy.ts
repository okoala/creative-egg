import logger from '../../common/GlimpseLogger';
import { IProxy } from '../IProxy';
import tracing from '../Tracing';
import { getGuid } from '../../common/GeneralUtilities';
import { getMessageIngressUrl, resolveUrl } from '../../common/RequestUtilities';

export type EventBody = ArrayBuffer | ArrayBufferView | Blob | Document | string | FormData;

/**
 * This event indicates that a request was sent, as indicated by a call to
 * an XMLHttpRequest instance's `send()` method.
 *
 * @property {string} id - An ID that is consistent for all stages of this request
 * @property {XMLHttpRequest} xhr - The XMLHttpRequest instance
 * @property {string} url - The resolved URL for the request
 * @property {string} method - The request method, e.g. "GET"
 * @property {object} headers - The request headers, represented as a key-value dictionary
 * @property {string} body - The body of the request, as passed to `xhr.send(body)`
 */
export interface IRequestSentEvent {
    id: string;
    xhr: XMLHttpRequest;
    url: string;
    method: string;
    headers;
    body: EventBody;
}
export const EVENT_XHR_REQUEST_SENT = 'invoke|pre|XMLHttpRequest.request-sent';

/**
 * This event indicates that a response was received. This event is fired either
 * as a response to a `readystatechange` event from the XMLHttpRequest object,
 * or that the `xhr.send()` method has returned, depending on if the request was
 * synchronous or asynchronous.
 *
 * @property {string} id - An ID that is consistent for all stages of this request
 * @property {XMLHttpRequest} xhr - The XMLHttpRequest instance
 * @property {string} url - The resolved URL for the request
 * @property {statusCode} number - The response status code, e.g. 200
 * @property {bodyType} string - The data type of the body, as reported by `xhr.responseType`
 * @property {string} body - The body of the request, as passed to `xhr.send(body)`
 */
export interface IResponseReceivedEvent {
    id: string;
    xhr: XMLHttpRequest;
    url: string;
    statusCode: number;
    statusMessage: string;
    bodyType: string;
    body: EventBody;
}
export const EVENT_XHR_RESPONSE_RECEIVED = 'notify|XMLHttpRequest.response-received';

/**
 * This event indicates an error happened during the request. Note that an error is
 * different than the server returning an error status code. In the latter case,
 * an `EVENT_RESPONSE_RECEIVED` event is dispatched. This type of error indicates
 * that a response was not received from the server.
 *
 * @property {string} id - An ID that is consistent for all stages of this request
 * @property {XMLHttpRequest} xhr - The XMLHttpRequest instance
 * @property {error} error - A description of the error, if one is available
 */
export interface IErrorEvent {
    id: string;
    xhr: XMLHttpRequest;
    error: string;
}
export const EVENT_XHR_ERROR = 'notify|XMLHttpRequest.error';

/**
 * This event indicates that the request was cancelled during the request. Note
 * that this is slightly different than an error, because the request may have
 * been able to be completed, had it been allowed to complete. This typically
 * happens when `xhr.abort()` is called, or when the page is navigated away from
 *
 * @property {string} id - An ID that is consistent for all stages of this request
 * @property {XMLHttpRequest} xhr - The XMLHttpRequest instance
 */
export interface IAbortEvent {
    id: string;
    xhr: XMLHttpRequest;
}
export const EVENT_XHR_ABORT = 'notify|XMLHttpRequest.abort';

/**
 * Proxy which wraps XHR usage and its various supporting functions.
 *
 * NOTE: Don't add any headers within this proxy, breaks CORS scenarioes.
 */
export class XHRProxy implements IProxy {
    public static isInitialized = false;

    public isSupported(): boolean {
        // Note: TypeScript doesn't know about XMLHttpRequest existing on Window, so we
        // reference the property this way to get around TypeScript
        //tslint:disable-next-line:no-any
        return !!(window && typeof (<any>window).XMLHttpRequest !== 'undefined');
    }

    public init() {
        if (XHRProxy.isInitialized) {
            logger.error('Glimpse Error: Cannot initialize the XHR Proxy more than once.');
            return;
        }

        //tslint:disable-next-line:no-any
        const oldXMLHttpRequest = (<any>window).XMLHttpRequest;

        function XMLHttpRequest() {
            const xhr = new oldXMLHttpRequest();
            const id = getGuid();

            function handleAsyncRequest(method, url) {

                const requestHeaders = {};

                xhr.addEventListener('readystatechange', () => {
                    if (xhr.readyState === oldXMLHttpRequest.DONE) {
                        const eventData: IResponseReceivedEvent = {
                            id,
                            xhr,
                            url: resolveUrl(url),
                            statusCode: xhr.status,
                            statusMessage: xhr.statusText,
                            bodyType: xhr.responseType,
                            body: xhr.response
                        };
                        tracing.publish(EVENT_XHR_RESPONSE_RECEIVED, eventData);
                    };
                });

                xhr.addEventListener('error', () => {
                    const eventData: IErrorEvent = {
                        id,
                        xhr,
                        error: xhr.statusText
                    };
                    tracing.publish(EVENT_XHR_ERROR, eventData);
                });

                xhr.addEventListener('abort', () => {
                    const eventData: IAbortEvent = {
                        id,
                        xhr
                    };
                    tracing.publish(EVENT_XHR_ABORT, eventData);
                });

                const oldSend = xhr.send;
                xhr.send = function send(body, ...sendArgs) {
                    const eventData: IRequestSentEvent = {
                        id,
                        xhr,
                        method,
                        url: resolveUrl(url),
                        body,
                        headers: requestHeaders
                    };
                    tracing.publish(EVENT_XHR_REQUEST_SENT, eventData);
                    oldSend.call(this, body, ...sendArgs);
                };

                const oldSetRequestHeader = xhr.setRequestHeader;
                xhr.setRequestHeader = function setRequestHeader(header, value, ...setRequestHeaderArgs) {
                    requestHeaders[header] = value;
                    oldSetRequestHeader.call(this, header, value, ...setRequestHeaderArgs);
                };
            }

            function handleSyncRequest(method, url) {
                const oldSend = xhr.send;

                const requestHeaders = {};
                const oldSetRequestHeader = xhr.setRequestHeader;
                xhr.setRequestHeader = function setRequestHeader(header, value, ...setRequestHeaderArgs) {
                    requestHeaders[header] = value;
                    oldSetRequestHeader.call(this, header, value, ...setRequestHeaderArgs);
                };

                xhr.send = function send(body, ...sendArgs) {
                    const requestEventData: IRequestSentEvent = {
                        id,
                        xhr,
                        method,
                        url: resolveUrl(url),
                        body,
                        headers: requestHeaders
                    };
                    tracing.publish(EVENT_XHR_REQUEST_SENT, requestEventData);
                    try {
                        oldSend.call(this, body, ...sendArgs);
                    } catch (e) {
                        const errorEventData: IErrorEvent = {
                            id,
                            xhr,
                            error: e.message
                        };
                        tracing.publish(EVENT_XHR_ERROR, errorEventData);
                        throw e;
                    }
                    const responseEventData: IResponseReceivedEvent = {
                        id,
                        xhr,
                        url: resolveUrl(url),
                        statusCode: xhr.status,
                        statusMessage: xhr.statusText || '',
                        bodyType: xhr.responseType,
                        body: xhr.response
                    };
                    tracing.publish(EVENT_XHR_RESPONSE_RECEIVED, responseEventData);
                };
            }

            const oldOpen = xhr.open;
            xhr.open = function open(method, url, async = true, ...openArgs) {

                const result = oldOpen.call(this, method, url, async, ...openArgs);

                // If the url equals the message ingress url, that means it's
                // a Glimpse message and we don't want to profile it
                if (url !== getMessageIngressUrl()) {
                    if (async) {
                        handleAsyncRequest(method, url);
                    } else {
                        handleSyncRequest(method, url);
                    }
                }

                return result;
            };

            return xhr;
        }
        // Copy the states (and anything else) from the original object to our proxy
        for (const prop in oldXMLHttpRequest) {
            if (oldXMLHttpRequest.hasOwnProperty(prop)) {
                XMLHttpRequest[prop] = oldXMLHttpRequest[prop];
            }
        }

        // Note: TypeScript doesn't know about XMLHttpRequest existing on Window, so we
        // reference the property this way to get around TypeScript, but we also have to
        // disable tslint in the process
        /* tslint:disable */
        window['XMLHttpRequest'] = XMLHttpRequest;
        /* tslint:enable */

        XHRProxy.isInitialized = true;
    }
}



// WEBPACK FOOTER //
// ./src/tracing/proxies/XHRProxy.ts