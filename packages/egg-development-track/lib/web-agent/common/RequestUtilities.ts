import { getGuid } from './GeneralUtilities';

export function getRequestId(): string {
  // NOTE: agent should look to see if it can get the id
  //       from a script tag first, then if it can't find
  //       it there look to for a cookie (in the case where
  //       we can't inject a script tag) and finally it will
  //       create one which will be used moving forward
  //       (CDN scenario).
  let id = document.getElementById('__glimpse_browser_agent').getAttribute('data-request-id');
  if (!id) {
    id = getCookie('.Glimpse.RequestId');
  }
  if (!id) {
    id = getGuid();
  }
  return id;
}

export function addEvent(element, eventName: string, cb): void {
  if (element.addEventListener) {
    element.addEventListener(eventName, cb, false);
  } else if (element.attachEvent) {
    element.attachEvent('on' + eventName, cb);
  }
}

export function getCookie(cookie) {
  // Modified from https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
  const regexp = new RegExp('(?:(?:^|.*;\\s*)' + cookie + '\\s*\\=\\s*([^;]*).*$)|^.*$');
  return document.cookie.replace(regexp, '$1');
}

export interface IHeaders {
  [header: string]: string | number | boolean;
}

export function getHeaderKeys(headers: Headers): string[] {
  const headerKeys = [];
  // tslint:disable-next-line:no-any
  if ((headers).keys) {
    // tslint:disable-next-line:no-any
    for (const header of (headers).keys()) {
      headerKeys.push(header);
    }
  } else if (headers.forEach) {
    headers.forEach((value, name) => headerKeys.push(name));
  }
  return headerKeys;
}

// Headers are not technically case sensitive, and the browser often normalizes
// header so that they are all lower case and all strings. This method does the
// same so that headers are always normalized from the browser agent in all cases.
export function normalizeHeaders(headers: IHeaders): IHeaders {
  const normalizedHeaders: IHeaders = {};
  for (const header in headers) {
    if (!headers.hasOwnProperty(header)) {
      continue;
    }

    let headerVal = headers[header];
    // tslint:disable-next-line:no-null-keyword
    if (headerVal !== undefined && headerVal !== null && typeof headerVal !== 'string') {
      headerVal = headerVal.toString();
    }
    normalizedHeaders[header.toLowerCase()] = headerVal;
  }
  return normalizedHeaders;
}

export function getMessageIngressUrl(): string {
  return document.getElementById('__glimpse_browser_agent').getAttribute('data-message-ingress-template');
}

export interface IParsedUrl {
  protocol: string;
  hostname: string;
  port?: number;
  pathname: string;
  search: string;
  hash: string;
}

export function parseUrl(url: string): IParsedUrl {
  const parser = document.createElement('a');
  parser.href = url;
  const parsedPort = parseInt(parser.port, 10);
  return {
    protocol: parser.protocol,
    hostname: parser.hostname,
    port: isNaN(parsedPort) ? undefined : parsedPort,
    pathname: parser.pathname,
    search: parser.search,
    hash: parser.hash,
  };
}

export function stringifyUrl(url: IParsedUrl): string {
  const portSuffix = url.port !== undefined ? `:${url.port}` : '';
  let stringifiedUrl = `${url.protocol}//${url.hostname}${portSuffix}${url.pathname}`;
  if (url.search) {
    stringifiedUrl += url.search;
  }
  if (url.hash) {
    stringifiedUrl += url.hash;
  }
  return stringifiedUrl;
}

const urlCache = {};
export function resolveUrl(url: string): string {
  if (urlCache[url]) {
    return urlCache[url];
  }
  return urlCache[url] = stringifyUrl(parseUrl(url));
}
