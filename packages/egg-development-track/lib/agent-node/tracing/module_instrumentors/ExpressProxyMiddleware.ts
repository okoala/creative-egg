'use strict';

import {
    EVENT_EXPRESS_INVOKE_PRE_ROUTE_METHOD,
    EVENT_EXPRESS_INVOKE_PRE_ROUTER_USE,
    EVENT_EXPRESS_INVOKE_PRE_ROUTER,
    EVENT_EXPRESS_INVOKE_PRE_STATIC
} from './ExpressEvents';
import Tracing from '../Tracing';

import * as _ from 'lodash';

/* tslint:disable:no-var-requires */
const httpCommon = require('_http_common');
/* tslint:disable:no-var-requires */

export class ExpressProxyMiddleware {

    public static init(express) {
        this.setupRouteMethodMiddleware(express);
        this.setupRouterMiddleware(express);
        this.setupStaticMiddleware(express);
    }

    // NOTE: Express uses the 'methods' package to generate the list below.
    //       The 'methods' package relies on the Node 'http' module, which
    //       relies on the _http_common module.  Importing the 'http' module
    //       in a proxy seems to confuse proxy-ing, but importing _http_common
    //       seems to work OK.

    // see https://github.com/jshttp/methods/blob/master/index.js#L40-L68 for origin of list below.

    public static getMethods() {

        if (!ExpressProxyMiddleware.methods) {
            ExpressProxyMiddleware.methods = httpCommon.methods.slice().sort();
            ExpressProxyMiddleware.methods = ExpressProxyMiddleware.methods.map(function lowerCaseMethod(method) {
                return method.toLowerCase();
            });
        }
        return ExpressProxyMiddleware.methods;
    }

    private static methods: string[];

    private static setupRouteMethod(express, method: string) {

        const oldMethod = express.Route.prototype[method];

        if (oldMethod) {
            express.Route.prototype[method] = function newMethod() {

                if (Tracing.isEventEnabled(EVENT_EXPRESS_INVOKE_PRE_ROUTE_METHOD)) {
                    const data = {
                        originalThis: this,
                        originalArgs: arguments,
                        methodName: method,
                        proxyFunction: newMethod
                    };

                    Tracing.publish(EVENT_EXPRESS_INVOKE_PRE_ROUTE_METHOD, data);
                }

                return oldMethod.apply(this, arguments);
            };
        }
    }

    private static setupRouteMethodMiddleware(express) {
        ExpressProxyMiddleware.getMethods().concat('all').forEach(method => {
            this.setupRouteMethod(express, method);
        });
    }

    private static setupRouterNaming(express) {
        const oldRouter = express.Router;
        const newRouter = function newRouter() {
            let router = oldRouter.apply(this, arguments);

            if (Tracing.isEventEnabled(EVENT_EXPRESS_INVOKE_PRE_ROUTER)) {
                const data = {
                    originalThis: this,
                    originalArgs: arguments,
                    router: router
                };

                Tracing.publish(EVENT_EXPRESS_INVOKE_PRE_ROUTER, data);
                router = data.router;

            }

            return router;
        };

        _.assign(newRouter, oldRouter);

        express.Router = newRouter;
    }

    private static setupRouterMiddleware(express) {
        const oldUse = express.Router.use;

        express.Router.use = function newUse() {

            if (Tracing.isEventEnabled(EVENT_EXPRESS_INVOKE_PRE_ROUTER_USE)) {
                const data = {
                    originalThis: this,
                    originalArgs: arguments,
                    proxyFunction: newUse
                };

                Tracing.publish(EVENT_EXPRESS_INVOKE_PRE_ROUTER_USE, data);
            }

            return oldUse.apply(this, arguments);
        };

        // NOTE: Because Express captures the Router properties upon creation, all patching of Router functions
        //       must happen before patching the Router function itself (e.g. for naming).

        this.setupRouterNaming(express);
    }

    private static setupStaticMiddleware(express) {
        const oldStatic = express.static;

        express.static = function newQuery() {
            const middleware = oldStatic.apply(this, arguments);

            if (Tracing.isEventEnabled(EVENT_EXPRESS_INVOKE_PRE_STATIC)) {
                const data = {
                    originalThis: this,
                    originalArgs: arguments,
                    middleware: middleware
                };

                Tracing.publish(EVENT_EXPRESS_INVOKE_PRE_STATIC, data);
            }

            return middleware;
        };
    }
}
