'use strict';

import { IModuleInstrumentor } from '../IModuleInstrumentor';
import { IModuleInfo } from '../IModuleInfo';
import { IEnableInstrumentationResult } from '../IEnableInstrumentationResult';
import { ExpressProxyActionRouteView } from './ExpressProxyActionRouteView';
import { ExpressProxyMiddleware } from './ExpressProxyMiddleware';

export class ExpressModuleInstrumentor implements IModuleInstrumentor {

    public get supportedModules(): { [ moduleName: string ]: string; } {
        return {
            'express': '4.x.x'
        };
    }

    public enableInstrumentation(moduleInfo: IModuleInfo): IEnableInstrumentationResult {
        ExpressProxyActionRouteView.init(moduleInfo.originalModule);
        ExpressProxyMiddleware.init(moduleInfo.originalModule);
        return {
            isEnabled: true
        };
    }
}
