import { IModuleInstrumentor } from './IModuleInstrumentor';

/**
 * The Module Manager is responsible for ensuring that modules are instrumented
 * properly for Glimpse to function. The Module Manager delegates to
 * Instrumentation Managers to enable specific modules for instrumentation. The
 * Module Manager can also be used to query the current state of instrumentation
 * that is enabled for the system
 */
export interface IModuleManager {

    /** register the given IProxyFactory for the given module ID */
    addModuleInstrumentor(factory: IModuleInstrumentor);
}
