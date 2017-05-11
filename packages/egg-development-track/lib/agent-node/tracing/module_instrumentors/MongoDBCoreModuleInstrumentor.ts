'use strict';

import { IModuleInstrumentor } from '../IModuleInstrumentor';
import { IModuleInfo } from '../IModuleInfo';
import { IEnableInstrumentationResult } from '../IEnableInstrumentationResult';
import { MongoDBCoreProxy } from './MongoDBCoreProxy';

export class MongoDBCoreModuleInstrumentor implements IModuleInstrumentor {

    public get supportedModules(): { [ moduleName: string ]: string; } {
        return {
            'mongodb-core': '>=1.2.0 <2.2.0'
        };
    }

    public enableInstrumentation(moduleInfo: IModuleInfo): IEnableInstrumentationResult {
        (new MongoDBCoreProxy()).init(moduleInfo);
        return {
            isEnabled: true
        };
    }
}
