'use strict';

import { IModuleInstrumentor } from '../IModuleInstrumentor';
import { IModuleInfo } from '../IModuleInfo';
import { IEnableInstrumentationResult } from '../IEnableInstrumentationResult';
import { MongoDBProxy } from './MongoDBProxy';

export class MongoDBModuleInstrumentor implements IModuleInstrumentor {

    public get supportedModules(): { [ moduleName: string ]: string; } {
        return {
            'mongodb': '>=2.0.14 <2.3.0'
        };
    }

    public enableInstrumentation(moduleInfo: IModuleInfo): IEnableInstrumentationResult {
        (new MongoDBProxy()).init(moduleInfo.originalModule, moduleInfo.version);
        return {
            isEnabled: true
        };
    }
}
