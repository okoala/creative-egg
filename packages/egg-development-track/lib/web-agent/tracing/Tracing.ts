/**
 * The Tracing module provides mechanisms for registering to receive tracing
 * events from proxies.
 *
 * This module is pretty similar to a standard EventEmitter, but has a few
 * key differences. This module provides the ability to filter out which
 * events you would like to receive, based on criteria of your choosing.
 *
 * Tracing can hurt performance in some cases, and filtering is a way for
 * the profiling application to improve performance whenever the data is not
 * explicitly needed.
 *
 * @module tracing/Tracing
 */
import { IProxyEvent } from './IProxyEvent';

export type IEventFilterCallback = () => boolean;
export type IEventCallback = (eventData: IProxyEvent) => void;

interface IListenerEntry {
    listener: IEventCallback;
}

class Tracing {

    private listeners: { [eventName: string]: IListenerEntry[]; } = {};

    /**
     * Publishes an event, similar to the `EventEmitter.emit` method except that it
     * does not accept more than one data argument.
     *
     * @param {string} event - The name of the event to fire, and should include a
     *      descriptive namespace, e.g. `http.request:request-created`
     * @param {object} data - The data associated with the event
     * @returns {boolean} - Whether or not the event was published to any listeners
     */
    public publish(event: string, data): boolean {
        const listeners = this.listeners[event];
        if (!listeners || listeners.length === 0) {
            return false;
        }
        let emitted = false;
        const message: IProxyEvent = {
            offset: performance.now(),
            timeStamp: Date.now(),
            data
        };
        for (const listener of listeners) {
            emitted = true;
            listener.listener(message);
        }
        return emitted;
    }

    /**
     * Register to always receive an event without any filtering. This module is
     * returned from this method, making it possible to chain `removeEventListener`
     * calls.
     *
     * Note: if any other listeners are filtering this event, registering with
     * this method will prevent the proxies from enabling any performance
     * optimizations.
     *
     * Calling this method is equivalent to calling `onFiltered(event, listener, () => true)`
     *
     * @param {string} event - The name of the event to listen to, e.g.
     *      `http.request:request-created`
     * @param {function} listener - The callback to call when the event is emitted
     */
    public on(event: string, listener: IEventCallback): Tracing {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push({
            listener
        });
        return this;
    }

    /**
     * Removes exactly one registered event listener. If the same callback is
     * registered more than once, only the first copy is removed. This behavior
     * mimics that of EventEmitter.removeEventListener
     *
     * @param {string} event - The name of the event to remove the listener for,
     *      e.g. `http.request:request-created`
     * @param {function} listener - The listener to remove
     * @returns {object} A refernce to this module, making it possible to chain
     *      removeEventListener calls
     */
    public removeEventListener(event: string, listener: IEventCallback): Tracing {
        const listeners = this.listeners[event];
        if (!listeners) {
            // Matches Node.js removeEventListener return signature
            return this;
        }
        for (let i = 0; i < listeners.length; i++) {
            if (listeners[i].listener === listener) {
                this.listeners[event].splice(i, 1);
                break;
            }
        }
        return this;
    }

    /**
     * Removes all listeners for the given event. If no event is specified, then
     * all event listeners for all events are removed.
     *
     * @param {string} event - (Optional) The event to remove listeners for
     * @returns {object} A refernce to this module, making it possible to chain calls
     */
    public removeAllListeners(event?: string): Tracing {
        if (event) {
            if (this.listeners[event]) {
                this.listeners[event] = [];
            }
        } else {
            this.listeners = {};
        }
        return this;
    }

    /**
     * Returns the number of listeners for the given event. This behavior
     * mimics that of EventEmitter.listenerCount
     *
     * @param {string} event - The event to count listeners for
     * @returns {number} The number of listeners for the given event
     */
    public listenerCount(event: string): number {
        if (!this.listeners[event]) {
            return 0;
        }
        return this.listeners[event].length;
    }
}

export default new Tracing();



// WEBPACK FOOTER //
// ./src/tracing/Tracing.ts