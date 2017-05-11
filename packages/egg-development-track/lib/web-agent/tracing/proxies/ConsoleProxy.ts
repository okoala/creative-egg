import { IProxy } from '../IProxy';
import tracing from '../Tracing';

export const NOTIFY_CONSOLE_EVENT_OCCURED = 'notify|event|console';

export interface IConsoleEvent {
    method: string;
    arguments: any[]; // tslint:disable-line:no-any
}

interface ProxyFunction { (): any; __glimpse_original: any; } // tslint:disable-line:no-any

export class ConsoleProxy implements IProxy {
    // NOTE: this should probably be pulled from the inspector,
    //       but that raising a dependency question and whether
    //       one should know about the other. Was thinking about
    //       adding a neutral party but thats overkill.
    public methods = [
        'assert',
        'count',
        'debug',
        'dir',
        'dirxml',
        'error',
        'group',
        'groupCollapsed',
        'groupEnd',
        'info',
        'log',
        'profile',
        'profileEnd',
        'table',
        'time',
        'timeEnd',
        'timeStamp',
        'trace',
        'warn'
    ];

    public isSupported() {
        // IE9 and older throws an exception if we try and write a value to
        // an undefined preoprty on console methods, so we test here if we
        // can write to `console.log`, and if not return not supported
        try {
            // tslint:disable-next-line:no-any
            (<any>console.log).__glimpse_enabled = true;
            // tslint:disable-next-line:no-any
            delete (<any>console.log).__glimpse_enabled;
        } catch (e) {
            return false;
        }
        return !!(window && typeof window.console !== 'undefined');
    }

    public init() {
        this.methods.forEach((methodKey) => {
            if (methodKey && console[methodKey] && !console[methodKey].__glimpse_original) {
                console[methodKey] = (function (key) {
                    const oldFunction = console[key];

                    const newFunction = <ProxyFunction>function () {
                        const args = Array.prototype.slice.call(arguments);

                        tracing.publish(NOTIFY_CONSOLE_EVENT_OCCURED, { method: key, arguments: args });

                        return oldFunction.apply(this, arguments);
                    };

                    oldFunction.__glimpse_proxy = newFunction;
                    newFunction.__glimpse_original = oldFunction;

                    return newFunction;
                }(methodKey));
            }
        });
    }
}



// WEBPACK FOOTER //
// ./src/tracing/proxies/ConsoleProxy.ts