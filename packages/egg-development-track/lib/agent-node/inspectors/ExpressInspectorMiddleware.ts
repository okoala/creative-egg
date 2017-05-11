'use strict';

import { IAgentProviders } from '../IAgent';
import { IAgentBroker } from '../messaging/IAgentBroker';
import { IContextManager } from '../messaging/IContextManager';
import { IDateTime } from '../configuration/IDateTime';
import { MiddlewareWrapper } from './util/MiddlewareWrapper';
import { IStackFrame, IStackHelper } from './util/StackHelper';
import { IConfigSettings } from '@glimpse/glimpse-common';
import Tracing from './../tracing/Tracing';
import {
    EVENT_EXPRESS_INVOKE_PRE_ROUTE_METHOD,
    EVENT_EXPRESS_INVOKE_PRE_ROUTER_USE,
    EVENT_EXPRESS_INVOKE_PRE_ROUTER,
    EVENT_EXPRESS_INVOKE_PRE_STATIC
} from './../tracing/module_instrumentors/ExpressEvents';

export class ExpressInspectorMiddleware {

    private broker: IAgentBroker;
    private contextManager: IContextManager;
    private dateTime: IDateTime;
    private stackHelper: IStackHelper;
    private configSettings: IConfigSettings;
    private middlewareWrapper: MiddlewareWrapper;

    public init(broker: IAgentBroker, providers: IAgentProviders) {
        this.broker = broker;

        this.dateTime = providers.dateTime;
        this.stackHelper = providers.stackHelper;
        this.configSettings = providers.configSettings;
        this.contextManager = providers.contextManager;
        this.middlewareWrapper = new MiddlewareWrapper(this.stackHelper, providers.messageConverter, this.broker, this.contextManager, this.dateTime);

        Tracing.onAlways(EVENT_EXPRESS_INVOKE_PRE_ROUTE_METHOD, (event) => {
            this.onMiddlewareMethodInvoked(event.data.originalThis, event.data.originalArgs, event.data.methodName, event.data.proxyFunction);
        });

        Tracing.onAlways(EVENT_EXPRESS_INVOKE_PRE_ROUTER_USE, (event) => {
            this.onUseInvokedBegin(event.data.originalThis, event.data.originalArgs, event.data.proxyFunction);
        });

        Tracing.onAlways(EVENT_EXPRESS_INVOKE_PRE_ROUTER, (event) => {
            this.onRouterInvokedEnd(event.data.router);
        });

        Tracing.onAlways(EVENT_EXPRESS_INVOKE_PRE_STATIC, (event) => {
            this.onStaticInvokedEnd(event.data.middleware);
        });
    }

    private onMiddlewareMethodInvoked(originalThis, originalArgs, method, proxyFunction) {
        if (originalThis.glimpse && originalThis.glimpse.ignore) {
            return;
        }

        if (originalArgs && originalArgs.length >= 1) {
            const frame = this.stackHelper.tryGetFirstUserCodeFrame(this.stackHelper.captureStack(proxyFunction, 100));
            const registrationCallstack: IStackFrame[] = frame ? [frame] : [];
            this.wrapNestedMiddleware(originalArgs, [originalThis.path], method !== 'all' ? method.toUpperCase() : undefined, registrationCallstack);
        }
    }

    private onUseInvokedBegin(originalThis, originalArgs, proxyFunction) {
        if (originalThis.glimpse && originalThis.glimpse.ignore) {
            return;
        }

        if (originalArgs && originalArgs.length >= 1) {
            let paths = ['/'];

            if (originalArgs.length > 1) {
                const firstArg = originalArgs[0];

                if (Array.isArray(firstArg) && firstArg.length > 0 && typeof firstArg[0] === 'string') {
                    paths = firstArg;
                }
                else if (typeof firstArg === 'string') {
                    paths = [firstArg];
                }
                else if (firstArg instanceof RegExp) {
                    paths = [firstArg.toString()];
                }
            }
            else if (originalArgs.length === 1) {
                const middleware = originalArgs[0];

                if (typeof middleware === 'function') {
                    if (!originalThis.glimpse) {
                        originalThis.glimpse = {
                            firstUse: middleware
                        };
                    }
                    else if (!originalThis.glimpse.firstUse) {
                        originalThis.glimpse.firstUse = middleware;
                    }
                    else if (!originalThis.glimpse.secondUse) {
                        originalThis.glimpse.secondUse = middleware;

                        // NOTE: If the first and second middleware added to a Router are 'query' and 'expressInit',
                        //       respectively, it's relatively certain that it's the built-in Express middleware that
                        //       we can't otherwise patch in order to attach metadata, so we do so here.

                        if (originalThis.glimpse.firstUse.name === 'query' && originalThis.glimpse.secondUse.name === 'expressInit') {
                            MiddlewareWrapper.attachMetadata(originalThis.glimpse.firstUse, 'query', 'Express Query Parser', 'express');
                            MiddlewareWrapper.attachMetadata(originalThis.glimpse.secondUse, 'expressInit', 'Express Initialization', 'express');
                        }
                    }
                }
            }

            // capture location of where use() is being called.
            const frame = this.stackHelper.tryGetFirstUserCodeFrame(this.stackHelper.captureStack(proxyFunction, 100));
            const registrationCallstack: IStackFrame[] = frame ? [frame] : [];
            this.wrapNestedMiddleware(originalArgs, paths, undefined, registrationCallstack);
        }
    }

    private wrapNestedMiddleware(array, paths: string[], method?: string, registrationCallstack?: IStackFrame[]) {
        for (let i = 0; i < array.length; i++) {
            const arg = array[i];

            if (typeof arg === 'function') {
                if (arg.glimpse && arg.glimpse.ignore) {
                    continue;
                }

                array[i] = this.middlewareWrapper.wrap(paths, method, arg, registrationCallstack);
            }
            else if (Array.isArray(arg)) {
                this.wrapNestedMiddleware(arg, paths, method, registrationCallstack);
            }
        }
    }

    private onRouterInvokedEnd(router) {
        MiddlewareWrapper.attachMetadata(router, 'router', 'Express Router', 'express');
    }

    private onStaticInvokedEnd(middleware) {
        MiddlewareWrapper.attachMetadata(middleware, 'serveStatic', 'Express Static File Server', 'express');
    }
}
