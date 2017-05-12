import { IModuleInstrumentor } from '../IModuleInstrumentor';
import { IModuleInfo } from '../IModuleInfo';
import { IEnableInstrumentationResult } from '../IEnableInstrumentationResult';
import { ConsoleProxy } from '../../inspectors/ConsoleProxy';
import { IAgent } from '../../IAgent';

export class ConsoleModuleInstrumentor implements IModuleInstrumentor {

  private agent: IAgent;

  public get supportedModules(): { [ moduleName: string ]: string; } {
    return {
      console: '0.12.0 - 7',
    };
  }

  public setAgent(agent: IAgent) {
    this.agent = agent;
  }

  public enableInstrumentation(moduleInfo: IModuleInfo): IEnableInstrumentationResult {

    const consoleProxy = new ConsoleProxy();
    consoleProxy.init(this.agent, moduleInfo.originalModule);

    // Right now we don't do any in-depth checking to see if the module couldn't
    // be enabled for some reason, so we hard return true here
    return {
      isEnabled: true,
    };
  }
}
