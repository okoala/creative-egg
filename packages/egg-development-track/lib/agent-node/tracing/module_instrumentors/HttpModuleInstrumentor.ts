'use strict';

import { IModuleInstrumentor } from '../IModuleInstrumentor';
import { IModuleInfo } from '../IModuleInfo';
import { IEnableInstrumentationResult } from '../IEnableInstrumentationResult';
import { HttpClientProxy } from './HttpClientProxy';
import { HttpProxy as HttpServerProxy } from '../../inspectors/HttpProxy';
import { WebInspector } from '../../inspectors/WebInspector';
import { EnvironmentInspector } from '../../inspectors/EnvironmentInspector';
import { IAgent } from '../../IAgent';

export class HttpModuleInstrumentor implements IModuleInstrumentor {

  private agent: IAgent;

  public get supportedModules(): { [moduleName: string]: string; } {
    return {
      http: '4 - 7',
      https: '4 - 7',
    };
  }

  public setAgent(agent: IAgent) {
    this.agent = agent;
  }

  public enableInstrumentation(moduleInfo: IModuleInfo): IEnableInstrumentationResult {

    // The client proxy is a little funny. The client module is implemented under
    // the hood such that the hooks we are interested are reused for both http and
    // https, so if we hooked both, we get doubled up messages
    if (moduleInfo.moduleId === 'http') {
      (new HttpClientProxy()).init(moduleInfo);
    }

    const httpProxy = new HttpServerProxy();

    // TODO: move back to the Agent once this is ported to the new proxy format
    httpProxy.addServerInspector(new WebInspector());
    httpProxy.addServerInspector(new EnvironmentInspector());

    const errorReportingService = this.agent ? this.agent.providers.errorReportingService : undefined;
    httpProxy.init(this.agent, moduleInfo.originalModule, moduleInfo.modulePath, errorReportingService);

    // Right now we don't do any in-depth checking to see if the module couldn't
    // be enabled for some reason, so we hard return true here
    return {
      isEnabled: true,
    };
  }
}
