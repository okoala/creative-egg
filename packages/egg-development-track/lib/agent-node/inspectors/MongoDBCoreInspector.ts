'use strict';

import { IAgent } from '../IAgent';
import { IContextManager } from '../messaging/IContextManager';
import Tracing from '../tracing/Tracing';
import {
    EVENT_MONGODB_CORE_INVOKE_PRE_MONGODB_CORE_SERVER_COMMAND,
    EVENT_MONGODB_CORE_INVOKE_PRE_MONGODB_CORE_POOL_WRITE,
    EVENT_MONGODB_CORE_INVOKE_PRE_MONGODB_CORE_CURSOR_NEXT
} from '../tracing/module_instrumentors/MongoDBEvents';

export class MongoDBCoreInspector {
    private contextManager: IContextManager;

    public init(agent: IAgent) {
        this.contextManager = agent.providers.contextManager;
        const self = this;

        function wrapCallback(event, callbackIndex) {
            const originalArgs = event.data.originalArgs;
            let callback = originalArgs[callbackIndex];

            if (self.contextManager.isWithinContext()) {
                if (typeof originalArgs[callbackIndex - 1] === 'function') {
                    callbackIndex--;
                    callback = originalArgs[callbackIndex];
                }

                // we need to propogate context for any callbacks so the glimpse context ID doesn't get lost
                callback = self.contextManager.wrapInCurrentContext(callback);
                event.data.originalArgs[callbackIndex] = callback;
            }
        }

        Tracing.onAlways(EVENT_MONGODB_CORE_INVOKE_PRE_MONGODB_CORE_SERVER_COMMAND, (event) => {
            // original signiture: command(ns, cmd, options, callback)
            wrapCallback(event, 3);
        });

        Tracing.onAlways(EVENT_MONGODB_CORE_INVOKE_PRE_MONGODB_CORE_POOL_WRITE, (event) => {
            // original signiture: command(buffer, options, cb), see
            // https://github.com/christkv/mongodb-core/blob/5b996789fa052a22ddbd680565befa2a11281fd9/lib/connection/pool.js#L836
            wrapCallback(event, 2);
        });

        Tracing.onAlways(EVENT_MONGODB_CORE_INVOKE_PRE_MONGODB_CORE_CURSOR_NEXT, (event) => {
            let originalArgs = event.data.originalArgs;
            let callback = originalArgs[0];

            if (self.contextManager.isWithinContext() && typeof callback === 'function') {
                // we need to propogate context for any callbacks so the glimpse context ID doesn't get lost
                callback = self.contextManager.wrapInCurrentContext(callback);
                event.data.originalArgs[0] = callback;
            }
        });
    }
}
