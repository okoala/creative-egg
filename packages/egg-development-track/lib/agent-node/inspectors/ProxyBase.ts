
import { IProxy } from './IProxy';
import { IConfigSettings, IErrorReportingService } from '@glimpse/glimpse-common';
import { IAgent } from '../IAgent';

export abstract class ProxyBase implements IProxy {

    public moduleName: string;

    /*tslint:disable:no-any */
    public abstract init(agent: IAgent, module: any, resolvedModulePath: string, errorReportingService?: IErrorReportingService): any;
    /*tslint:enable:no-any */

    public isEnabledForModule(moduleName: string, configSettings: IConfigSettings): boolean {
        const settingKey = 'proxy.' + moduleName + '.enabled';
        return configSettings.getBoolean(settingKey, true);
    }

    /**
     *  returns true if the module should be loaded immediated after proxy initialization, false if not
     */
    public get forceLoadModule() { return false; }
}
