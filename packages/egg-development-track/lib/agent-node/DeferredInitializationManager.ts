import {
  IDeferredInitializationCallback,
  IDeferredInitializationManager,
  IDeferredInitializationRegisteredCallback,
} from './IDeferredInitializationManager';

/**
 * A component for managing deferred, asynchronous initialization.
 */
export class DeferredInitializationManager implements IDeferredInitializationManager {
  private err: Error;
  private registered: IDeferredInitializationRegisteredCallback[] = [];
  private state: ('NOT_INITIALIZED' | 'INITIALIZING' | 'INITIALIZED') = 'NOT_INITIALIZED';
  private waiters: IDeferredInitializationCallback[] = [];

  /**
   * Called when deferred initialization should be performed.
   *
   * NOTE: This should ideally be called once, prior to the first request being received.
   *
   * @param done A callback called when initialization is complete.
   */
  public init(done: IDeferredInitializationCallback): void {
    if (this.state === 'INITIALIZED') {
      // Initialization is complete so just immediately invoke the callback...
      return done(this.err);
    }

    // Initialization has not started or is ongoing, so wait for completion...
    this.waiters.push(done);

    if (this.state === 'NOT_INITIALIZED') {
      // This is the first call to init() so kick off initialization...
      this.performInitialization();
    }
  }

  /**
   * Register a callback to be invoked when deferred initialization is to be performed.
   *
   * @param init The callback to be invoked during initialization.
   */
  public onInit(init: IDeferredInitializationRegisteredCallback): void {
    if (this.state !== 'NOT_INITIALIZED') {
      throw new Error('onInit() must be called prior to the start of initialization.');
    }

    this.registered.push(init);
  }

  private performInitialization() {
    this.state = 'INITIALIZING';

    // TODO: Consider running each in parallel?

    const loop = () => {
      if (this.registered.length) {
        const current = this.registered.shift();

        return current((err) => {
          if (err) {
            return this.completeInitialization(err);
          }

          loop();
        });
      }

      this.completeInitialization(undefined);
    };

    loop();
  }

  private completeInitialization(err: Error) {
    this.err = err;
    this.state = 'INITIALIZED';

    while (this.waiters.length) {
      const waiter = this.waiters.shift();

      waiter(this.err);
    }
  }
}

export default DeferredInitializationManager;
