
import * as request from 'request';
import { ContextManagerProvider } from './ContextManagerProvider';

export function glimpseServerRequest(uri: string, options?: request.CoreOptions, callback?: request.RequestCallback) {
  const contextManager = ContextManagerProvider.getContextManager();
  contextManager.runInNullContext((context) => {
    request(uri, options, callback);
  });
}
