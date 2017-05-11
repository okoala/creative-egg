/**
 *  An IModuleInfo contains all relevant metadata associated with a module
 *  as identified by a file system path to the module's location on disk (i.e.,
 *  where the module was loaded from).
 *
 *  An IModuleInfo is 1-to-1 with a unique path on disk, and 1-to-many with
 *  a module ID.  e.g., require('lodash') may result in multiple versions of
 *  lodash being loaded from multiple paths on disk.  Each unique path will
 *  have it's own IModuleInfo
 *
 *  An IModuleInfo is useful to other components in the system in order to
 *  output more meaningful error messages, enhance telemetry messages,
 *  and query the state of known modules.
 */
export interface IModuleInfo {
    /** path to module.  Uniquely identifies an IModuleInfo instance */
    modulePath: string;

    /** the name of the module as passed to require() */
    moduleId: string;

    /** version of the module */
    version: string;

    /** true for modules that ship in node core */
    isBuiltIn: boolean;

    /** result of the original require() call */
    originalModule;
}
