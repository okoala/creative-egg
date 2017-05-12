'use strict';

import { satisfies } from 'semver';
import Tracing from '../Tracing';
import { IModuleInfo } from '../IModuleInfo';
import {
  EVENT_MONGODB_CORE_INVOKE_PRE_MONGODB_CORE_SERVER_COMMAND,
  EVENT_MONGODB_CORE_INVOKE_PRE_MONGODB_CORE_POOL_WRITE,
  EVENT_MONGODB_CORE_INVOKE_PRE_MONGODB_CORE_CURSOR_NEXT,
} from './MongoDBEvents';

export class MongoDBCoreProxy {
  /**
   * event names for mongodb-core
   */

  public init(moduleInfo: IModuleInfo) {
    const mongodbCoreModule = moduleInfo.originalModule;

    // mongodb-core 1.x funnels all commands to be issued to mongodb through
    // Server.prototype.command, however this was changed in 2.x so that it
    // is funneled through a connection pool at serverInstance.s.pool.write,
    // so we have to switched based on the mongodb-core to hook into the
    // right place. These events are used to properly track async calls
    if (satisfies(moduleInfo.version, '>=2.0.0')) {
      /**
       * Override of mongodb-core Server.prototype.connect so that we can
       * override serverInstance.s.pool.write. The pool is created during
       * the call to `connect`
       */
      const functionServerConnect = mongodbCoreModule.Server.prototype.connect;
      mongodbCoreModule.Server.prototype.connect = function connectProxy() {
        const retval = functionServerConnect.apply(this, arguments);

        const functionWritePool = this.s.pool.write;
        this.s.pool.write = function writeProxy() {
          if (Tracing.isEventEnabled(EVENT_MONGODB_CORE_INVOKE_PRE_MONGODB_CORE_POOL_WRITE)) {
            const data = {
              originalThis: this,
              originalArgs: arguments,
            };

            Tracing.publish(EVENT_MONGODB_CORE_INVOKE_PRE_MONGODB_CORE_POOL_WRITE, data);
          }
          functionWritePool.apply(this, arguments);
        };

        return retval;
      };
    } else {
      /**
       * override of mongodb-core Server.prototype.command
       */
      const functionServerCommand = mongodbCoreModule.Server.prototype.command;
      mongodbCoreModule.Server.prototype.command = function commandProxy() {
        if (Tracing.isEventEnabled(EVENT_MONGODB_CORE_INVOKE_PRE_MONGODB_CORE_SERVER_COMMAND)) {
          const data = {
            originalThis: this,
            originalArgs: arguments,
          };

          Tracing.publish(EVENT_MONGODB_CORE_INVOKE_PRE_MONGODB_CORE_SERVER_COMMAND, data);
        }
        functionServerCommand.apply(this, arguments);
      };
    }

    /**
     * override of mongodb-core Cursor.prototype.next
     */
    const functionCursorNext = mongodbCoreModule.Cursor.prototype.next;
    mongodbCoreModule.Cursor.prototype.next = function nextProxy() {
      if (Tracing.isEventEnabled(EVENT_MONGODB_CORE_INVOKE_PRE_MONGODB_CORE_CURSOR_NEXT)) {
        const data = {
          originalThis: this,
          originalArgs: arguments,
        };

        Tracing.publish(EVENT_MONGODB_CORE_INVOKE_PRE_MONGODB_CORE_CURSOR_NEXT, data);
      }
      functionCursorNext.apply(this, arguments);
    };
  }
}
