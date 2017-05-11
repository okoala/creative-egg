/**
 * The results of attempting to enable instrumentation for a module. If
 * instrumentation of the module is successfully enabled, `isEnabled` will
 * be set to true, and `status` will be `undefined`. If instrumentation could
 * not be enabled, `isEnabled` will be set to false and the reason that it
 * could not be enabled will be available in the `status` property.
 */
export interface IEnableInstrumentationResult {

    /** Whether or not instrumentation of the module was enabled */
    isEnabled: boolean;

    /** If `isEnabled` is false, the reason instrumentation could not be enabled */
    status?: string;
}
