import { IInspector } from './IInspector';
import { IMessagePublisher } from '../MessagePublisher';
import { IProxyEvent } from '../tracing/IProxyEvent';
import { EVENT_NAVIGATION_TIMING_COLLECTED, INavigationTimingCollectionEvent } from '../tracing/proxies/NavigationTimingProxy';
import tracing from '../tracing/Tracing';

export class NavigationTimingInspector implements IInspector {
  public init(messagePublisher: IMessagePublisher) {
    tracing.on(EVENT_NAVIGATION_TIMING_COLLECTED, (event: IProxyEvent) => {
      const data: INavigationTimingCollectionEvent = event.data;
      const message = {
        loadDuration: data.loadEventEnd - data.fetchStart,
        // time spent constructing the DOM tree
        domReadyDuration: data.domComplete - data.domInteractive,
        // time consumed preparing the new page
        readyStartDuration: data.fetchStart - data.navigationStart,
        // time spent during redirection
        redirectDuration: data.redirectEnd - data.redirectStart,
        // appCache
        appcacheDuration: data.domainLookupStart - data.fetchStart,
        // time spent unloading documents
        unloadEventDuration: data.unloadEventEnd - data.unloadEventStart,
        // DNS query time
        lookupDomainDuration: data.domainLookupEnd - data.domainLookupStart,
        // TCP connection time
        connectDuration: data.connectEnd - data.connectStart,
        // time spent during the request
        requestDuration: data.responseEnd - data.requestStart,
        // request to completion of the DOM loading
        initDomTreeDuration: data.domInteractive - data.responseEnd,
        // load event time
        loadEventDuration: data.loadEventEnd - data.loadEventStart,

        // time spent on the network making the outgoing request
        networkRequestDuration: data.requestStart - data.navigationStart,
        // time spent on the network receiving the incoming response
        networkResponseDuration: data.responseEnd - data.responseStart,
        // time spent on the server processing the request
        serverDuration: data.responseEnd - data.requestStart,
        // time spent on the browser handling the response
        browserDuration: data.loadEventEnd - data.responseStart,
        // total time
        totalDuration: data.loadEventEnd - data.navigationStart,

        ...event.data
      };
      // time spent on the network for the whole request/response
      message.networkDuration = message.networkRequestDuration + message.networkResponseDuration;

      // TODO: Eventually, we'll add more logic here to clean up data in
      // https://github.com/Glimpse/Glimpse.Browser.Agent/issues/29.
      messagePublisher.createAndPublishMessage('browser-navigation-timing', message);
    });
  }
}



// WEBPACK FOOTER //
// ./src/inspectors/NavigationTimingInspector.ts