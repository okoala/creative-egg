/**
 * All instrumentation events have these basic properties, and may add more.
 * See the documentation for the specific instrumentor in question for
 * information on the other properties in the event object
 */
export interface IInstrumentationEvent {

    /**
     * The relative time that the event occured at. This is expressed as an
     * array of two numbers as [seconds, nanoseconds] as returned from
     * `process.hrtime()`
     */
    time: number[];

    /**
     * The timestamp the event occured in, as returned from `Date.now()`, i.e.
     * milliseconds since UNIX epoch.
     */
    timestamp: number;

    /**
     * Event specific data
     */
    data;
}
