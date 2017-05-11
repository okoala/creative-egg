import { IProxy } from '../IProxy';
import tracing from '../Tracing';
import { getGuid } from '../../common/GeneralUtilities';

/**
 * This event indicates that a request was sent, as indicated by a call to
 * `self.fetch()`
 *
 * @property {string} id - An ID that is consistent for all stages of this request
 * @property {Request} request - A request object representing the user request.
 *      Note: this is always a request object, regardless of how the fetch API
 *      was called. If a request object was passed to the `fetch()` method, this
 *      request object is a clone of that one, not the original instance.
 */
export interface IRequestSentEvent {
    id: string;
    request: Request;
}
export const EVENT_FETCH_REQUEST_SENT = 'invoke|pre|fetch.request-sent';

/**
 * This event indicates that a response was received. This event is fired when
 * the promise returned from a call to `self.fetch()` is resolved (not rejected).
 *
 * @property {string} id - An ID that is consistent for all stages of this request
 * @property {Response} response - The response object. Note: this response object
 *      is a cloned copy of the response object that the original promise returned,
 *      not the original instance.
 */
export interface IResponseReceivedEvent {
    id: string;
    response: Response;
}
export const EVENT_FETCH_RESPONSE_RECEIVED = 'notify|fetch.response-received';

/**
 * This event indicates an error happened during the request, which is done
 * by waiting for the promise returned by `fetch()` to reject. There is a caveat
 * though: rejections caused by malformed input does _not_ cause an error event
 * to be emitted. This is by design, as this error condition means no request
 * was ever sent at all, even if the promise returned from `fetch()` _does_ reject.
 *
 * @property {string} id - An ID that is consistent for all stages of this request
 * @property {XMLHttpRequest} xhr - The XMLHttpRequest instance
 * @property {error} error - A description of the error, if one is available
 */
export interface IErrorEvent {
    id: string;
    error: string | Error;
}
export const EVENT_FETCH_ERROR = 'notify|fetch.error';

/**
 * Proxy which wraps fetch usage and its various supporting functions.
 *
 * NOTE: Don't add any headers within this proxy, breaks CORS scenarioes.
 */
export class FetchProxy implements IProxy {
    public isSupported(): boolean {
        return !!(self && typeof self.fetch !== 'undefined');
    }

    public init() {
        // Note: we use `self` instead of `window` in case we're in a worker thread
        // See https://developer.mozilla.org/en-US/docs/Web/API/Window/self

        // Only initialize if this browser supports the Fetch API
        if (self.fetch) {
            const oldFetch = self.fetch;
            self.fetch = function fetch(input, init, ...args) {
                // Create a request object if one wasn't specified, or clone the
                // existing one if it was so we can safely read the body.
                let request;
                if (input instanceof Request) {
                    request = input.clone();
                } else {
                    // OK, so I know this looks weird, but the use of Promises
                    // here provides a unique challenge. If you instantiate a
                    // Request object directly, it will throw an exception if the
                    // input is malformed. However, the `fetch()` API is wrapped
                    // in a promise, which means malformed input does _not_ throw
                    // when passed to `fetch()`. Instead it causes the promise to
                    // reject. We do _not_ want to pick up on this case though,
                    // because we would otherwise publish an ERROR_EVENT, which
                    // we do _not_ want in this case. So we detect malformed input,
                    // and return the promise directly without listening to it.
                    try {
                        request = new Request(input, init);
                    } catch (e) {
                        return oldFetch.call(this, input, init, ...args);
                    }
                }

                const id = getGuid();

                // Publish the request message
                const requestSentEventData: IRequestSentEvent = {
                    id,
                    request
                };
                tracing.publish(EVENT_FETCH_REQUEST_SENT, requestSentEventData);

                // Call the original fetch method. We wait for the response to be
                // received using the promise, and publish the resulting
                const fetchPromise = oldFetch.call(this, input, init, ...args);
                fetchPromise.then((response) => {
                    const responseReceivedEventData: IResponseReceivedEvent = {
                        id,
                        response: response.clone()
                    };
                    tracing.publish(EVENT_FETCH_RESPONSE_RECEIVED, responseReceivedEventData);
                }, (error) => {
                    const errorEventData: IErrorEvent = {
                        id,
                        error
                    };
                    tracing.publish(EVENT_FETCH_ERROR, errorEventData);
                });

                return fetchPromise;
            };
        }
    }
}



// WEBPACK FOOTER //
// ./src/tracing/proxies/FetchProxy.ts