import { IContextManager, IRunInContextCallback } from './IContextManager';
import { ContextManagerBase } from './ContextManagerBase';

import * as http from 'http';

/*tslint:disable:no-var-requires */
const cls = require('continuation-local-storage');
/*tslint:enable:no-var-requires */

export class ContextManagerContinuationLocalStorage extends ContextManagerBase implements IContextManager {

  private static GLIMPSE_NAMESPACE = 'GLIMPSE_NAMESPACE';
  private static GLIMPSE_CONTEXT = 'GLIMPSE_CONTEXT';
  private _namespace;

  public init() {
    super.init();
    this._namespace = cls.createNamespace(ContextManagerContinuationLocalStorage.GLIMPSE_NAMESPACE);
  }

  // tslint:disable-next-line:no-any
  public runInNewContext(req: http.IncomingMessage, callback: IRunInContextCallback): any {
    const wrapper = () => {
      const context = this.createContext(req);
      this._namespace.set(ContextManagerContinuationLocalStorage.GLIMPSE_CONTEXT, context);
      return callback(context);
    };
    const boundFunction = this._namespace.bind(wrapper, this._namespace.createContext());
    return boundFunction();
  }

  // tslint:disable-next-line:no-any
  public runInNullContext(callback: IRunInContextCallback): any {
    const wrapper = () => {
      const context = undefined;
      this._namespace.set(ContextManagerContinuationLocalStorage.GLIMPSE_CONTEXT, context);
      return callback(context);
    };
    const boundFunction = this._namespace.bind(wrapper, this._namespace.createContext());
    return boundFunction();
  }

  public wrapInCurrentContext(callback: IRunInContextCallback) {
    return this._namespace.bind(callback, this._namespace.active);
  }

  public currentContext() {
    if (this._namespace.active) {
      return this._namespace.get(ContextManagerContinuationLocalStorage.GLIMPSE_CONTEXT);
    } else {
      return undefined;
    }
  }
}
