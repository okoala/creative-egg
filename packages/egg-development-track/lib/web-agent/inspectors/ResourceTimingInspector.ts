import { IInspector } from './IInspector';
import { IMessagePublisher } from '../MessagePublisher';
import { IProxyEvent } from '../tracing/IProxyEvent';
import { EVENT_RESOURCE_TIMING_COLLECTED } from '../tracing/proxies/ResourceTimingProxy';
import tracing from '../tracing/Tracing';

export class ResourceTimingInspector implements IInspector {
  public init(messagePublisher: IMessagePublisher) {
    tracing.on(EVENT_RESOURCE_TIMING_COLLECTED, (event: IProxyEvent) => {
      // TODO: Eventually, we'll add more logic here to clean up data in
      // https://github.com/Glimpse/Glimpse.Browser.Agent/issues/29.
      messagePublisher.createAndPublishMessage('browser-resource', {
        timings: event.data
      });
    });
  }
}



// WEBPACK FOOTER //
// ./src/inspectors/ResourceTimingInspector.ts