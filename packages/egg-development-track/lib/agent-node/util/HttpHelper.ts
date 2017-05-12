import _ = require('lodash');
import { Url } from 'url';
import parse = require('parseurl');
import cookie = require('cookie');
import http = require('http');

import { IContext } from '../messaging/IContextManager';
import { IConfigSettings } from '../../common';
import { IPartSummary } from '../inspectors/IServerRequestInspector';

const MIME_TYPES_TO_CAPTURE = [
  /^text\//,
  /^application\/.*?xml/,
  /^application\/json/,
  /^application\/javascript/,
  /^application\/x-www-form-urlencoded/,
  /^multipart\/form-data/,
];

export class RequestHelper {
  public static header(req, name) {
    const lc = name.toLowerCase();

    switch (lc) {
      case 'referer':
      case 'referrer':
        return req.headers.referrer || req.headers.referer;
      default:
        return req.headers[lc];
    }
  }

  /*
  // TODO: not worring about trust/proxies, etc. at the moment
  protocol: function(req) {
      ...
      var trust = this.app.get('trust proxy fn');
      if (!trust(req.connection.remoteAddress, 0)) {
          return proto;
      }
      ....
  },
  */
  public static protocol(req) {
    let proto = req.connection.encrypted ? 'https' : 'http';
    proto = this.header(req, 'X-Forwarded-Proto') || proto;

    return proto.split(/\s*,\s*/)[0];
  }

  public static parseurl(req): Url | undefined {
    return parse(req);
  }

  /*
  // TODO: not worring about trust/procies etc atm
  hostname: function(req) {
      ...
      var trust = this.app.get('trust proxy fn');
      var host = request.header(req, 'X-Forwarded-Host');
      if (!host || !trust(req.connection.remoteAddress, 0)) {
          host = request.header(req, 'Host');
      }
      ...
  }
  */
  public static host(req) {
    return this.header(req, 'X-Forwarded-Host') || this.header(req, 'Host');
  }

  public static hostname(req) {
    const host = RequestHelper.host(req);
    if (!host) {
      return;
    }

    // IPv6 literal support
    const offset = host[0] === '[' ? host.indexOf(']') + 1 : 0;
    const index = host.indexOf(':', offset);

    return index !== -1 ? host.substring(0, index) : host;
  }

  public static parseCookies(req) {
    const result = this.header(req, 'cookie');

    return result ? cookie.parse(result) : undefined;
  }
}

export class ResponseHelper {
  public static appendHeader(res, field, val) {
    const prev = res.getHeader(field);
    let value = val;

    if (prev) {
      // concat the new and prev vals
      value = Array.isArray(prev) ? prev.concat(val)
        : Array.isArray(val) ? [prev].concat(val)
          : [prev, val];
    }

    return res.setHeader(field, value);
  }

  public static setCookie(res, name, value, options?) {
    const opts: any = _.defaults({}, options, { path: '/' });

    if ('maxAge' in opts) {
      opts.expires = new Date(Date.now() + opts.maxAge);
      // TODO: What is this doing?
      opts.maxAge /= 1000;
    }

    this.appendHeader(res, 'Set-Cookie', cookie.serialize(name, String(value), opts));

    return this;
  }

  public static clearCookie(res, name, options) {
    const opts = _.defaults({}, options, { expires: new Date(1), path: '/' });

    return this.setCookie(res, name, '', opts);
  }
}

export interface IContentType {
  type: string;
  subtype: string;
  parameters: { [key: string]: string };
}

export interface IBodyProperty {
  size: number;
  encoding: string;
  content: string;
  isTruncated: boolean;
  parts?: IPartSummary[];
}

export class HttpHelper {

  /**
   * helper method to store the context on an HTTP request or response instance
   */
  public static setContext(
    requestResponse: http.IncomingMessage | http.ServerResponse | http.ClientRequest,
    context: IContext,
  ) {
    /*tslint:disable:no-any */
    (requestResponse as any).__glimpseContext = context;
    /*tslint:enable:no-any */
  }

  /**
   * helper method to retrieve the context from an HTTP request or response instance
   */
  public static getContext(requestResponse: http.IncomingMessage | http.ServerResponse | http.ClientRequest): IContext {
    if (requestResponse) {
      /*tslint:disable:no-any */
      return ((requestResponse as any).__glimpseContext) as IContext;
      /*tslint:enable:no-any */
    }
    return undefined;
  }

  public static isInProcessServerRequest(request: http.IncomingMessage): boolean {
    // tslint:disable-next-line:no-any
    return !!(request as any).__glimpse_inProcessServerRequest;
  }

  public static isInProcessServerResponse(response: http.ServerResponse): boolean {
    // tslint:disable-next-line:no-any
    return !!(response as any).__glimpse_inProcessServerResponse;
  }

  public static getMaxBodySize(configSettings: IConfigSettings): number {
    return configSettings.get('inspector.http.body.capture.maxsize', 132000);
  }

  /**
   * Creates the `body` property for the `data-http-request`, `data-http-response`,
   * `web-request`, and `web-response` messages. The value returned from this
   * method can be directly assigned to the body property of a message
   *
   * @parameter {http.IncomingMessage | http.ClientRequest | http.ServerResponse} request -
   *      The request or response of an HTTP client or server request associated
   *      with the body
   * @parameter {Array<Buffer | string>} bodyChunks - The body chunks, as sent
   *      to `data` events but also truncated so that the length is not greater
   *      than the maximum body capture size configuration option
   * @parameter {number} size - The size of the captured body, irrespective of
   *      the maximum capture body size configuration option
   * @returns {IBodyProperty} The body property for the http message
   */
  public static createMessageBodyProperty(
    request: http.IncomingMessage | http.ClientRequest | http.ServerResponse,
    bodyChunks: Array<Buffer | string>,
    size: number,
    configSettings: IConfigSettings,
    partSummaries?: IPartSummary[]): IBodyProperty {

    // We determine if the body content-type is one that we know how to
    // parse in the client or not, and then change the body property
    // based on this knowledge. Note: the headers exist in different places
    // in the request and response, and sometimes at different times in the
    // request, so we explicitly check headers in a specific order below.
    const headers = (request as any).headers || (request as any)._headers;
    const contentType = headers['Content-Type'] || headers['content-type'];
    let shouldCaptureBody = false;
    if (contentType) {
      for (const mimeType of MIME_TYPES_TO_CAPTURE) {
        if (mimeType.test(contentType)) {
          shouldCaptureBody = true;
          break;
        }
      }
    }

    // We only create a body property if body content was captured
    if (bodyChunks.length) {
      // Create the body property if we determined that we know how
      // to process the content type
      if (shouldCaptureBody) {
        // TODO: https://github.com/Glimpse/Glimpse.Node/issues/307 Add support for base64 encoding
        const convertedBody = [];
        for (const bodyChunk of bodyChunks) {
          if (Buffer.isBuffer(bodyChunk)) {
            convertedBody.push(bodyChunk.toString());
          } else {
            convertedBody.push(bodyChunk);
          }
        }
        const serializedBody = convertedBody.join('');
        if (serializedBody.length > size) {
          throw new Error('Internal error: size is smaller than body length');
        }
        return {
          size,
          encoding: 'utf8',
          content: serializedBody,
          isTruncated: size > HttpHelper.getMaxBodySize(configSettings),
          parts: partSummaries,
        };
      } else {
        return {
          size,
          encoding: 'none',
          content: '',
          isTruncated: true,
          parts: partSummaries,
        };
      }
    }

    // If we got here, this means no body was captured and we want the `body`
    // property in the message to not be included. This return isn't necessary
    // from a JavaScript perspective, since no return is implicitly `return undefined`
    // but we do it explicitly as a reminder of what's going on and why.
    return undefined;
  }

  /**
   * Given an IContentType, return true if the content type is multipart/form-data, false otherwise
   */
  public static isMultiPartFormData(contentType: IContentType): boolean {
    return contentType.type === 'multipart' && contentType.subtype === 'form-data';
  }

  /**
   * Given an IContentType, return the boundary delimiter string if available, or undefined if not available.
   * This will strip leading/trailing double-quotes if present.
   */
  public static getMultiPartFormBoundary(contentType: IContentType): string {
    // tslint:disable-next-line:no-string-literal
    let boundary = contentType.parameters['boundary'];
    if (boundary) {
      if (boundary.indexOf('"') === 0 && boundary.lastIndexOf('"') === boundary.length - 1) {
        // boundary value is enclosed in double-quotes so strip them out
        boundary = boundary.substring(1, boundary.length - 1);
      }
    }
    return boundary;
  }

  public static isValidBoundary(boundary: string): boolean {
    // boundary must be between 0 & 70 characters
    return boundary && boundary.length > 0 && boundary.length < 71;
  }

  /**
   * parse a content-type header into its respective parts per RFC 1341
   * https://www.w3.org/Protocols/rfc1341/4_Content-Type.html.
   *
   * Note this implementation is "accomodating" of input that doesn't conform to the spec.
   */
  public static parseContentType(header: string): IContentType {
    let type = '';
    let subtype = '';
    const parameters: { [key: string]: string } = {};

    if (header) {
      // find first slash & set type
      let curr = 0;
      while (curr < header.length && header[curr] !== '/') {
        ++curr;
      }
      const slash = curr;
      // type is case insensitive, so force it to lower case here
      type = header.substring(0, curr).trim().toLowerCase();

      // find first semi-column & set sub-type
      while (curr < header.length && header[curr] !== ';') {
        ++curr;
      }
      let lastSemi = curr;
      if (curr <= header.length) {
        // sub-type is case insensitive
        subtype = header.substring(slash + 1, curr).trim().toLowerCase();
      }

      // parse name/value pairs of parameters section
      ++curr;
      while (curr < header.length) {
        while (curr < header.length && (header[curr] !== '=' && header[curr] !== ';')) {
          curr++;
        }
        const nameEnd = curr;
        let valueEnd = curr;
        if (header[curr] === '=') {
          while (curr < header.length && header[curr] !== ';') {
            curr++;
          }
          valueEnd = curr;
        }

        const name = header.substring(lastSemi + 1, nameEnd);
        const value = valueEnd > nameEnd ? header.substring(nameEnd + 1, valueEnd) : '';
        if (name.length > 0) {
          // names are case-insensitive, but values are generally not
          parameters[name.trim().toLowerCase()] = value.trim();
        }
        lastSemi = valueEnd;
        ++curr;
      }
    }

    return {
      type,
      subtype,
      parameters,
    };
  }
}
