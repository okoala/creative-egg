'use strict';

import { IModuleInstrumentor } from '../IModuleInstrumentor';
import { IModuleInfo } from '../IModuleInfo';
import { IEnableInstrumentationResult } from '../IEnableInstrumentationResult';
import { MorganProxy } from '../../inspectors/MorganProxy';
import { IAgent } from '../../IAgent';

export class MorganModuleInstrumentor implements IModuleInstrumentor {

  private agent: IAgent;

  public get supportedModules(): { [moduleName: string]: string; } {
    return {
      morgan: '1.8.x',
    };
  }

  public setAgent(agent: IAgent) {
    this.agent = agent;
  }

  public enableInstrumentation(moduleInfo: IModuleInfo): IEnableInstrumentationResult {

    const morganProxy = new MorganProxy();
    morganProxy.init(this.agent, moduleInfo.originalModule);

    // Right now we don't do any in-depth checking to see if the module couldn't
    // be enabled for some reason, so we hard return true here
    return {
      isEnabled: true,
    };
  }
}
