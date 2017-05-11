import { IInspector } from './IInspector';
import { IMessagePublisher } from '../MessagePublisher';
import { IProxyEvent } from '../tracing/IProxyEvent';
import tracing from '../tracing/Tracing';
import {
  IPerformanceMarkEvent, EVENT_PERFORMANCE_MARK,
  IPerformanceMeasureEvent, EVENT_PERFORMANCE_MEASURE
} from '../tracing/proxies/PerformanceProxy';
import { addOffset } from '../common/MessageMixins';
import { getStackTrace, IStackFrame } from '../common/CallStackUtilities';

export class PerformanceInspector implements IInspector {

  private messagePublisher: IMessagePublisher;

  private markIdCache: { [id: string]: string } = {};

  public init(messagePublisher: IMessagePublisher) {
    this.messagePublisher = messagePublisher;
    tracing.on(EVENT_PERFORMANCE_MARK, (data) => this.mark(data));
    tracing.on(EVENT_PERFORMANCE_MEASURE, (data) => this.measure(data));
  }

  private mark(data: IProxyEvent) {
    const eventData: IPerformanceMarkEvent = data.data;
    const message = this.messagePublisher.createMessage('debug-timestamp', {
      name: eventData.name
    });

    // Save the internal ID <> message ID correlation for lookup in measure
    // events. We do this two stage caching level so that proxies don't need
    // to know anything about the details of how message IDs work.
    this.markIdCache[eventData.id] = message.id;

    // Override the message offset directly. We override it manually instead
    // of using `addOffset` because that method adjust the offset we pass to
    // be relative to `performance.timing.requestStart - performance.timing.fetchStart`
    // however the offsets we receive here are from performance.timing, so they
    // are already relative to the proper time, and so shouldn't be adjusted
    message.offset = eventData.startTime;

    // If the mark is a built-in mark, then we skip collecting the stack trace
    // because there is no actual stack trace associated with the mark
    if (eventData.isBuiltIn) {
      // Wrap the publish in a set timeout to make the asynchronicity
      // of this method consistent across different event configurations
      setTimeout(() => this.messagePublisher.publishMessage(message), 0);
    } else {
      // We create the message first, and add frames later, to ensure that
      // the mark ID cache is filled and waiting when `performance.measure`
      // is called, which may occur before the getStackTrace callback is
      // called.
      getStackTrace((frames: IStackFrame[]) => {
        message.payload.frames = frames;
        this.messagePublisher.publishMessage(message);
      });
    }
  }

  private measure(data: IProxyEvent) {
    const eventData: IPerformanceMeasureEvent = data.data;

    const startMarkMessageId = this.markIdCache[eventData.startMarkId];
    const endMarkMessageId = this.markIdCache[eventData.endMarkId];

    const message = this.messagePublisher.createMessage('debug-timestamp-measurement', {
      correlationMessageIds: [startMarkMessageId, endMarkMessageId],
      category: 'duration',
      name: eventData.name
    });
    addOffset(data.offset, message);

    this.messagePublisher.publishMessage(message);
  }
}



// WEBPACK FOOTER //
// ./src/inspectors/PerformanceInspector.ts