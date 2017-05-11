import { IEnableInstrumentationResult } from './IEnableInstrumentationResult';
import { IModuleInfo } from './IModuleInfo';

/**
 * An module instrumentor is responsible for enabling/disabling instrumentation
 * for a given module. They are registered with the Module Manager, who is then
 * responsible for loading
 */
export interface IModuleInstrumentor {

    /**
     * The module IDs supported by this instrumentation manager,
     * e.g. `{ 'http': '>=4.0.0 <7.0.0', 'https': '>=6.0.0 <7.0.0' }`
     */
    supportedModules: { [ moduleName: string ]: string; };

    /**
     * Enables instrumentation for the module described by `moduleInfo` and
     * returns the instrumentation information, if instrumentation was enabled
     */
    enableInstrumentation(moduleInfo: IModuleInfo): IEnableInstrumentationResult;
}
