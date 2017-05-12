import { IAgent } from '../IAgent';
import { ProxyBase } from './ProxyBase';
import { IMiddlewareFunction, MiddlewareWrapper } from './util/MiddlewareWrapper';

export class CookieParserProxy extends ProxyBase {

  public get moduleName(): string { return 'cookie-parser'; }

  public init(agent: IAgent, module) {

    const newModule = function () {
      const middleware = module.apply(this, arguments) as IMiddlewareFunction;

      MiddlewareWrapper.attachMetadata(middleware, 'cookieParser', 'Cookie Parser', 'cookie-parser');

      return middleware;
    };

    return newModule;
  }
}
