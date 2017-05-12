import { IAgent } from '../IAgent';
import { IConfigSettings } from '../../common';

/* tslint:disable:no-any */

export interface IProxy {
  moduleName: string;
  /**
   *  returns true if the module should be loaded immediated after proxy initialization, false if not
   */
  forceLoadModule: boolean;
  init(agent: IAgent, module: any, resolvedModulePath: string): any;
  isEnabledForModule(moduleName: string, configSettings: IConfigSettings): boolean;
}
