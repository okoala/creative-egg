import Tracing from '../Tracing';
import moment = require('moment');
import {
  EVENT_MONGODB_COLLECTION_INSERT,
  EVENT_MONGODB_READ_RECORD,
  EVENT_MONGODB_READ_END,
  EVENT_MONGODB_READ_START,
  EVENT_MONGODB_COLLECTION_COUNT,
  EVENT_MONGODB_COLLECTION_INSERT_METHODS,
  EVENT_MONGODB_COLLECTION_UPDATE_METHODS,
  EVENT_MONGODB_COLLECTION_DELETE_METHODS,
} from './MongoDBEvents';

/* tslint:disable:no-any */

/**
 * Interface that represents key logic for a proxy
 */
interface IProxyHelper {
  (methodName: string, originalThis: any, originalArgs: object): any;
}

export class MongoDBProxy {
  private realCollectionMethods: any = {};
  private realCursorMethods: any = {};


  /**
   * Normalizes position of optional options and callback arguments on the given array.
   */
  private static swizzleArgs(argsArray) {
    if (!Array.isArray(argsArray)) {
      argsArray = Array.prototype.slice.call(argsArray, 0);
    }

    if (typeof argsArray[1] === 'function') {
      argsArray.push(argsArray[1]);
      argsArray[1] = {};
    } else if (!argsArray[1]) {
      argsArray[1] = {};
    }
    return argsArray;
  }

  public init(mongodbModule, resolvedPath) {

    const self = this;

    /**
     * override of mongodb Collection.prototype.insert
     */
    function insertProxy() {
      const args = MongoDBProxy.swizzleArgs(arguments);
      if (Tracing.isEventEnabled(EVENT_MONGODB_COLLECTION_INSERT)) {
        const data = {
          originalArgs: args,
        };
        Tracing.publish(EVENT_MONGODB_COLLECTION_INSERT, data);
      }
      return self.realCollectionMethods.insert.apply(this, args);
    }

    // Collection overrides
    this.addProxyForCollectionMethod('insert', insertProxy, mongodbModule);
    this.setupCollectionProxy(
      ['deleteMany', 'deleteOne', 'findOneAndDelete', 'remove'], this.deleteProxy, mongodbModule,
    );
    this.setupCollectionProxy(['insertMany', 'insertOne'], this.insertMethodsProxy, mongodbModule);
    this.setupCollectionProxy(
      ['updateOne', 'updateMany', 'replaceOne', 'findOneAndUpdate'], this.updateProxy, mongodbModule,
    );
    this.setupCollectionProxy(['count'], this.collectionReadProxy, mongodbModule);

    // Cursor overrides
    this.setupCursorProxy(['toArray', 'next', 'nextObject'], this.cursorStartReadProxyCallbackOrPromise, mongodbModule);
    this.setupCursorProxy(['forEach', 'each'], this.cursorStartReadProxyCallbackNoPromise, mongodbModule);
    this.setupCursorProxy(['close'], this.cursorCloseProxy, mongodbModule);
  }

  /**
   * Add a proxy for a mongoDB collection method
   */
  private setupCollectionProxy(targets: string[], proxyHelper: IProxyHelper, mongoDBModule) {
    const self = this;
    for (let i = 0; i < targets.length; i++) {
      ((key) => {
        function proxy() {
          return proxyHelper.call(self, key, this, arguments);
        }
        this.addProxyForCollectionMethod(key, proxy, mongoDBModule);
      })(targets[i]);
    }
  }

  /**
   * Add a proxy for a mongoDB collection method
   */
  private setupCursorProxy(targets: string[], proxyHelper: IProxyHelper, mongoDBModule) {
    const self = this;
    for (let i = 0; i < targets.length; i++) {
      ((key) => {
        function proxy() {
          return proxyHelper.call(self, key, this, arguments);
        }
        this.addProxyForCursorMethod(key, proxy, mongoDBModule);
      })(targets[i]);
    }
  }

  /**
   *  helper method to hookup up a proxy method on the mongoDB collection class
   */
  private addProxyForCollectionMethod(key, proxy, mongodb) {
    this.realCollectionMethods[key] = mongodb.Collection.prototype[key];
    mongodb.Collection.prototype[key] = proxy;
  }

  /**
   * helper method to hookup up a proxy method on the mongoDB cursor class
   */
  private addProxyForCursorMethod(key, proxy, mongodb) {
    this.realCursorMethods[key] = mongodb.Cursor.prototype[key];
    mongodb.Cursor.prototype[key] = proxy;
  }

  /**
   * helper method to proxy various cursor read statements that support a callback or a promise
   */
  private cursorCloseProxy(methodName: string, originalThis: any, originalArgs: Object) {
    const startTime = moment();
    const hrtime = process.hrtime();

    function afterSuccess(result) {
      if (Tracing.isEventEnabled(EVENT_MONGODB_READ_END)) {
        const data = {
          originalThis,
          methodName,
          startTime,
          hrtime,
          err: undefined,
        };

        Tracing.publish(EVENT_MONGODB_READ_END, data);
      }
    }

    function afterFailure(err) {
      if (Tracing.isEventEnabled(EVENT_MONGODB_READ_END)) {
        const data = {
          originalThis,
          methodName,
          startTime,
          hrtime,
          err,
        };

        Tracing.publish(EVENT_MONGODB_READ_END, data);
      }
    }

    return this.callbackOrPromise(
      originalThis, originalArgs, 0, 1, this.realCursorMethods[methodName], afterSuccess, afterFailure,
    );
  }

  /**
   * helper method to proxy various cursor read statements that support a callback or a promise
   */
  private cursorStartReadProxyCallbackOrPromise(methodName: string, originalThis: any, originalArgs: Object) {
    const startTime = moment();
    const hrtime = process.hrtime();

    if (Tracing.isEventEnabled(EVENT_MONGODB_READ_START)) {
      const data = {
        originalThis,
        methodName,
        startTime,
        hrtime,
      };
      Tracing.publish(EVENT_MONGODB_READ_START, data);
    }

    function afterSuccess(result) {
      if (Tracing.isEventEnabled(EVENT_MONGODB_READ_RECORD)) {
        const data = {
          originalThis,
          methodName,
          startTime,
          hrtime,
          result,
          err: undefined,
        };

        Tracing.publish(EVENT_MONGODB_READ_RECORD, data);
      }
    }

    function afterFailure(err) {
      if (Tracing.isEventEnabled(EVENT_MONGODB_READ_RECORD)) {
        const data = {
          originalThis,
          methodName,
          startTime,
          hrtime,
          result: undefined,
          err,
        };

        Tracing.publish(EVENT_MONGODB_READ_RECORD, data);
      }
    }

    return this.callbackOrPromise(
      originalThis, originalArgs, 0, 1, this.realCursorMethods[methodName], afterSuccess, afterFailure,
    );
  }

  /**
   * helper method to proxy cursor read statements that support only callbacks
   */
  private cursorStartReadProxyCallbackNoPromise(methodName: string, originalThis: any, originalArgs: Object) {
    const startTime = moment();
    const hrtime = process.hrtime();

    if (Tracing.isEventEnabled(EVENT_MONGODB_READ_START)) {
      const data = {
        originalThis,
        methodName,
      };
      Tracing.publish(EVENT_MONGODB_READ_START, data);
    }

    // assume args[0] is the callback we need to wrap
    if (typeof (originalArgs[0]) === 'function') {
      const callback = originalArgs[0];
      const callbackWrapper = function callbackWrapper(err, result) {
        if (Tracing.isEventEnabled(EVENT_MONGODB_READ_RECORD)) {
          const data = {
            originalThis,
            methodName,
            startTime,
            hrtime,
            result,
            err,
          };

          Tracing.publish(EVENT_MONGODB_READ_RECORD, data);
        }
        callback.apply(this, arguments);
      };
      originalArgs[0] = callbackWrapper;
    }
    return this.realCursorMethods[methodName].apply(originalThis, originalArgs);
  }

  /**
   * Proxy for collection read count
   */
  private collectionReadProxy(methodName: string, originalThis: any, originalArgs: Object) {
    const startTime = moment();
    const hrtime = process.hrtime();

    function afterSuccess(result) {
      if (Tracing.isEventEnabled(EVENT_MONGODB_COLLECTION_COUNT)) {
        const data = {
          originalThis,
          originalArgs,
          methodName,
          startTime,
          hrtime,
          err: undefined,
        };

        Tracing.publish(EVENT_MONGODB_COLLECTION_COUNT, data);
      }
    }

    function afterFailure(err) {
      if (Tracing.isEventEnabled(EVENT_MONGODB_COLLECTION_COUNT)) {
        const data = {
          originalThis,
          originalArgs,
          methodName,
          startTime,
          hrtime,
          err,
        };

        Tracing.publish(EVENT_MONGODB_COLLECTION_COUNT, data);
      }
    }

    return this.callbackOrPromise(
      originalThis, originalArgs, 0, 3, this.realCollectionMethods[methodName], afterSuccess, afterFailure,
    );
  }

  /**
   *  helper method to proxy various insert methods
   */
  private insertMethodsProxy(methodName: string, originalThis: any, originalArgs: Object) {
    const startTime = moment();
    const hrtime = process.hrtime();

    function afterSuccess(result) {
      if (Tracing.isEventEnabled(EVENT_MONGODB_COLLECTION_INSERT_METHODS)) {
        const data = {
          originalThis,
          originalArgs,
          methodName,
          startTime,
          hrtime,
          result,
          err: undefined,
        };

        Tracing.publish(EVENT_MONGODB_COLLECTION_INSERT_METHODS, data);
      }
    }

    function afterFailure(err) {
      if (Tracing.isEventEnabled(EVENT_MONGODB_COLLECTION_INSERT_METHODS)) {
        const data = {
          originalThis,
          originalArgs,
          methodName,
          startTime,
          hrtime,
          result: undefined,
          err,
        };

        Tracing.publish(EVENT_MONGODB_COLLECTION_INSERT_METHODS, data);
      }
    }

    return this.callbackOrPromise(
      originalThis, originalArgs, 1, 2, this.realCollectionMethods[methodName], afterSuccess, afterFailure,
    );
  }

  /**
   * Proxy for update methods including 'updateOne', 'updateMany', 'replaceOne', 'findOneAndUpdate'
   */
  private updateProxy(methodName: string, originalThis: any, originalArgs: Object) {
    const startTime = moment();
    const hrtime = process.hrtime();

    function afterSuccess(result) {
      if (Tracing.isEventEnabled(EVENT_MONGODB_COLLECTION_UPDATE_METHODS)) {
        const data = {
          originalThis,
          originalArgs,
          methodName,
          startTime,
          hrtime,
          result,
          err: undefined,
        };

        Tracing.publish(EVENT_MONGODB_COLLECTION_UPDATE_METHODS, data);
      }
    };

    function afterFailure(err) {
      if (Tracing.isEventEnabled(EVENT_MONGODB_COLLECTION_UPDATE_METHODS)) {
        const data = {
          originalThis,
          originalArgs,
          methodName,
          startTime,
          hrtime,
          result: undefined,
          err
        };

        Tracing.publish(EVENT_MONGODB_COLLECTION_UPDATE_METHODS, data);
      }
    }

    return this.callbackOrPromise(
      originalThis, originalArgs, 2, 2, this.realCollectionMethods[methodName], afterSuccess, afterFailure,
    );
  }

  /**
   *  helper method to proxy deleteOne, deleteMany or findOneAndDelete
   */
  private deleteProxy(methodName: string, originalThis: any, originalArgs: Object) {
    const startTime = moment();
    const hrtime = process.hrtime();

    function afterDeleteSuccess(result) {
      if (Tracing.isEventEnabled(EVENT_MONGODB_COLLECTION_DELETE_METHODS)) {
        const data = {
          originalThis,
          originalArgs,
          methodName,
          startTime,
          hrtime,
          result,
          err: undefined,
        };

        Tracing.publish(EVENT_MONGODB_COLLECTION_DELETE_METHODS, data);
      }
    }

    function afterDeleteFailure(err) {
      if (Tracing.isEventEnabled(EVENT_MONGODB_COLLECTION_DELETE_METHODS)) {
        const data = {
          originalThis,
          originalArgs,
          methodName,
          startTime,
          hrtime,
          result: undefined,
          err,
        };
        Tracing.publish(EVENT_MONGODB_COLLECTION_DELETE_METHODS, data);
      }
    }

    return this.callbackOrPromise(
      originalThis,
      originalArgs,
      1,
      2,
      this.realCollectionMethods[methodName],
      afterDeleteSuccess,
      afterDeleteFailure,
    );
  }

  /**
   * helper method that will execute a callback if present, or return a promise.
   *
   * @callbackStartIndex - the string  index into originalArgs of where a callback may be.
   * @callbackProbeLength - the number of slots in originalArgs to probe for a paramater of type function.
   * This will be the callback.
   * @realMethod - is the actual method that we're proxying.
   * @onSuccess - the callback to raise when @realMethod is successful.
   * @onFailure - the callback to raise when @realMethod fails.
   */
  private callbackOrPromise(
    originalThis,
    originalArgs,
    callbackStartIndex,
    callbackProbeLength,
    realMethod,
    onSuccess,
    onFailure,
  ) {
    let originalCallback;
    let callbackIndex = -1;
    for (let i = callbackStartIndex; i < callbackStartIndex + callbackProbeLength; i++) {
      if (typeof originalArgs[i] === 'function') {
        callbackIndex = i;
        originalCallback = originalArgs[i];
        break;
      }
    }

    if (originalCallback) {
      const callbackWrapper = function callbackWrapper(err, result) {
        if (err) {
          onFailure(err);
        } else {
          onSuccess(result);
        }
        originalCallback.apply(this, arguments);
      };

      // replace callback in arguments array
      originalArgs[callbackIndex] = callbackWrapper;

      return realMethod.apply(originalThis, originalArgs);
    } else {
      // no callback specified, so we return a promise.
      // this.s.promiseLibrary is a promise constructor.  this.s is Collection's internal state
      const promiseFunction = function promiseFunction(resolve, reject) {
        function proxySuccess(r) {
          onSuccess.apply(this, arguments);
          resolve(r);
        }

        function proxyFailed(err) {
          onFailure.apply(this, arguments);
          reject(err);
        }

        realMethod.apply(originalThis, originalArgs)
          .then(proxySuccess, proxyFailed);
      };

      return new originalThis.s.promiseLibrary(promiseFunction);
    }
  }
}
