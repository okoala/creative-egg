'use strict';
import { ClientRequest, IncomingMessage } from 'http';

/**
 * This event indicates that a request was created via a call to `http.request()`.
 * This event does *not* indicate that the request was sent, nor that headers are
 * ready to be read, that happens in `IRequestEndEvent`.
 *
 * @property {string} id - An ID that is consistent for all stages of this request
 * @property {ClientRequest} req - The client request object returned from `http.request`
 * @property {object} options - The options passed to `http.request`
 */
export interface IClientRequestCreatedEvent {
    id: string;
    req: ClientRequest;
    options;
}
export const EVENT_HTTP_CLIENT_REQUEST_CREATED = 'invoke|post|module:httpClient.request-created';

/**
 * This event indicates that request data was sent to the remote server. This may have
 * occured because of a `req.write` call or a `req.end` call.
 *
 * @property {string} id - An ID that is consistent for all stages of this request
 * @property {ClientRequest} req - The client request object returned from `http.request`
 * @proprety {Buffer|String} chunk - The data chunk written to the remote server
 */
export interface IClientRequestDataSentEvent {
    id: string;
    req: ClientRequest;
    chunk: Buffer | string;
}
export const EVENT_HTTP_CLIENT_REQUEST_DATA_SENT = 'invoke|pre|module:httpClient.request-data-sent';

/**
 * This event indicates that the request was finalized. No more data may be written
 * after this event, and it is now possible to read the final headers for the request
 *
 * @property {string} id - An ID that is consistent for all stages of this request
 * @property {ClientRequest} req - The client request object returned from `http.request`
 */
export interface IClientRequestEndEvent {
    id: string;
    req: ClientRequest;
}
export const EVENT_HTTP_CLIENT_REQUEST_END = 'invoke|post|module:httpClient.request-end';

/**
 * This event indicates that there was an error completing the request. Note,
 * this event will not be emitted after the `REQUEST_END_EVENT` is emitted.
 * Further errors will be emitted as `EVENT_RESPONSE_ERROR`
 *
 * @property {string} id - An ID that is consistent for all stages of this request
 * @property {ClientRequest} req - The client request object returned from `http.request`
 * @property {Error|string} error - The error that occured
 */
export interface IClientRequestErrorEvent {
    id: string;
    req: ClientRequest;
    error: Error | string;
}
export const EVENT_HTTP_CLIENT_REQUEST_ERROR = 'notify|module:httpClient.request-error';

/**
 * This event indicates that headers for the response have been received. Any response data
 * will come after this event in an `IResponseDataReceivedEvent` event.
 *
 * @property {string} id - An ID that is consistent for all stages of this request
 * @property {ClientRequest} req - The client request object returned from `http.request`
 * @property {IncomingMessage} res - The incoming response from the remote server, as passed
 *      to the `response` event.
 */
export interface IClientResponseReceivedEvent {
    id: string;
    req: ClientRequest;
    res: IncomingMessage;
}
export const EVENT_HTTP_CLIENT_RESPONSE_RECEIVED = 'notify|module:httpClient.response-received';

/**
 * This event indicates that data was recieved from the remote server.
 *
 * @property {string} id - An ID that is consistent for all stages of this request
 * @property {ClientRequest} req - The client request object returned from `http.request`
 * @property {IncomingMessage} res - The incoming response from the remote server, as passed
 * @proprety {Buffer|String} chunk - The data chunk received from the remote server
 *      to the `response` event.
 */
export interface IClientResponseDataReceivedEvent {
    id: string;
    req: ClientRequest;
    res: IncomingMessage;
    chunk: Buffer | string;
}
export const EVENT_HTTP_CLIENT_RESPONSE_DATA_RECEIVED = 'notify|module:httpClient.response-data-received';

/**
 * This event indicates the response has ended and the client request has finished.
 *
 * @property {string} id - An ID that is consistent for all stages of this request
 * @property {ClientRequest} req - The client request object returned from `http.request`
 * @property {IncomingMessage} res - The incoming response from the remote server, as passed
 */
export interface IClientResponseEndEvent {
    id: string;
    req: ClientRequest;
    res: IncomingMessage;
}
export const EVENT_HTTP_CLIENT_RESPONSE_END = 'notify|module:httpClient.response-end';

/**
 * This event indicates that there was an error completing the response. Note:
 * this event will not be emitted before `EVENT_RESPONSE_RECEIVED`
 *
 * @property {string} id - An ID that is consistent for all stages of this request
 * @property {ClientRequest} req - The client request object returned from `http.request`
 * @property {IncomingMessage} res - The incoming response from the remote server, as passed
 * @property {Error|string} error - The error that occured
 */
export interface IClientResponseErrorEvent {
    id: string;
    req: ClientRequest;
    res: IncomingMessage;
    error: Error | string;
}
export const EVENT_HTTP_CLIENT_RESPONSE_ERROR = 'notify|module:httpClient.response-error';
