import { IAgent } from '../IAgent';
import { IConfigSettings } from '@glimpse/glimpse-common';

/* tslint:disable:no-any */

export interface IProxy {
    moduleName: string;
    init(agent: IAgent, module: any, resolvedModulePath: string): any;
    isEnabledForModule(moduleName: string, configSettings: IConfigSettings): boolean;

    /**
     *  returns true if the module should be loaded immediated after proxy initialization, false if not
     */
    forceLoadModule: boolean;
}
