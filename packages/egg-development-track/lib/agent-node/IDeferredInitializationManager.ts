/**
 * Represents a callback for notification of the completion of deferred initialization.
 */
export interface IDeferredInitializationCallback {

  /**
   * @param err (Optional) The error that occurred during initialization (if any).
   */
  (err?: Error): void;
}

/**
 * Represents a callback that performs deferred initialization.
 */
export interface IDeferredInitializationRegisteredCallback {

  /**
   * @param done A callback to be invoked by the callback when initialization is complete.
   */
  (done: IDeferredInitializationCallback): void;
}

/**
 * Represents a manager of asynchronous initialization of Glimpse components.
 *
 * Components should use this component when they need to perform asynchronous
 * initialization post Glimpse init() but prior to the first request being received.
 */
export interface IDeferredInitializationManager {

  /**
   * Called when deferred initialization should be performed.
   *
   * NOTE: This should ideally be called once, prior to the first request being received.
   *
   * @param done A callback called when initialization is complete.
   */
  init(done: IDeferredInitializationCallback): void;

  /**
   * Register a callback to be invoked when deferred initialization is to be performed.
   *
   * @param init The callback to be invoked during initialization.
   */
  onInit(init: IDeferredInitializationRegisteredCallback): void;
}

export default IDeferredInitializationManager;
