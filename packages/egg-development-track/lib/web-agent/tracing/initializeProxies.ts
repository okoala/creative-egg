import { IProxyClass } from './IProxy';
import { XHRProxy } from './proxies/XHRProxy';
import { FetchProxy } from './proxies/FetchProxy';
import { ResourceTimingProxy } from './proxies/ResourceTimingProxy';
import { NavigationTimingProxy } from './proxies/NavigationTimingProxy';
import { ConsoleProxy } from './proxies/ConsoleProxy';
import { PerformanceProxy } from './proxies/PerformanceProxy';

const proxies: { [proxyName: string]: IProxyClass } = {
  XHRProxy,
  FetchProxy,
  ResourceTimingProxy,
  NavigationTimingProxy,
  ConsoleProxy,
  PerformanceProxy,
};

export default function initializeProxies(): void {
  for (const proxyName in proxies) {
    if (proxies.hasOwnProperty(proxyName)) {
      const proxy = new proxies[proxyName];

      // Only initiate (attach) proxies if they are
      // able to be used in the client.
      if (proxy.isSupported()) {
        proxy.init();
      }
    }
  }
}
