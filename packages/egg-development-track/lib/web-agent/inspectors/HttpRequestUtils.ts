
import { convertBlobToText } from '../common/GeneralUtilities';
import { MAX_HTTP_BODY_SIZE } from '../common/Constants';

/**
 * interface definition for a body part of data-http-request/data-http-response message
 */
export interface IBody {
  size: number;
  encoding: string;
  content: string;
  isTruncated: boolean;
  parts?: IPartSummary[];
}

/**
 *  A summary of a single part in a multi-part/form body
 */
export interface IPartSummary {
  headers: { [key: string]: string[] }; // map of header name to an array of header value.
  bodyStartIndex?: number;  // index in the multi-part payload of the first character of this part's body.
  bodyEndIndex?: number;    // index in the multi-part payload of the first character  **after** this part's body.
  bodyLength?: number;      // length of body in bytes
}

/**
 * set of regular expressions that match a mime type when the encoding of a payload is UTF8
 */
const UTF8_ENCODING_MIME_TYPES = [
  /^text\//,
  /^application\/.*?xml/,
  /^application\/json/,
  /^application\/javascript/,
  /^application\/x-www-form-urlencoded/,
  /^multipart\/form-data/
];

/**
 * Infer the encoding type given a blob
 *
 * @param blob The blob to get the encoding for
 */
function getEncodingForBlob(blob: Blob) {
  let encoding = 'none';
  for (const mimeType of UTF8_ENCODING_MIME_TYPES) {
    if (mimeType.test(blob.type)) {
      encoding = 'utf8';
      break;
    }
  }
  return encoding;
}

export function createEmptyBody(isTruncated: boolean): IBody {
  return {
    size: 0,
    encoding: 'none',
    content: '',
    isTruncated
  };
}

export function createBodyForBlob(contentTypeHeader: string, blob: Blob, includeParts: boolean, cb: (body: IBody) => void): void {
  // TODO: https://github.com/Glimpse/Glimpse.Node.Prototype/issues/307
  // Add support for base64 encoding non-text content by setting the encoding here

  // Note on use of setTimeout() below.  This is done to ensure all code paths execute asynchronously,
  // irrespective of whether convertBlobtoText is called.  For a more in-depth discussion,
  // see https://nodejs.org/dist/latest-v7.x/docs/api/process.html#process_process_nexttick_callback_args

  if (blob.size) {
    let encoding = getEncodingForBlob(blob);
    switch (encoding) {
      case 'utf8':
        convertBlobToText(blob, encoding, (content) => {
          const boundary = getMultiPartFormBoundary(contentTypeHeader);
          const parts = boundary && includeParts ? getMultiPartFormParts(boundary, content) : [];
          content = content.slice(0, MAX_HTTP_BODY_SIZE);
          const bodyMessage: IBody = {
            size: blob.size,
            encoding,
            content,
            isTruncated: blob.size > content.length
          };
          if (parts && includeParts) {
            bodyMessage.parts = parts;
          }
          cb(bodyMessage);
        });
        break;
      default:
        setTimeout(() => cb({
          size: blob.size,
          encoding,
          content: '',
          isTruncated: true
        }), 0);
        break;
    }
  } else {
    setTimeout(() => cb(createEmptyBody(false)), 0);
  }
}

/**
 * Function to convert a string to a map from header-name => string[] of header values
 *
 * @param rawHeaders raw headers string
 */
function convertRawHeaders(rawHeaders: string): { [key: string]: string[] } {
  const h: { [key: string]: string[] } = {};
  rawHeaders = rawHeaders.trim();
  const lines = rawHeaders.split('\r\n');
  lines.forEach((l) => {
    const idx = l.indexOf(':');
    if (idx > 0) {
      const name = l.substring(0, idx).trim().toLowerCase();
      const value = l.substring(idx + 1, l.length).trim();
      if (!h[name]) {
        h[name] = [];
      }
      h[name].push(value);
    }
  });

  return h;
}

/**
 * Regular expression to pull boundary delimiter from multipart/form-data content type.
 * valid boundary characters taken from grammar defined in https://www.ietf.org/rfc/rfc2046.txt, Appendix A
 */
const MULTIPART_FORMDATA_REG_EX = /\s*(multipart\/form-data)\s*;.*boundary\s*=\s*"?([0-9a-zA-Z'()+_,-.\/:=?]+)"?/i;

/**
 * Get the boundary delimiter for a multipart/forma-data content-type header.
 * If boundary paramter doesn't exist, or if content-type is not multipart/form-data
 * this will return undefined;
 *
 * @param contentTypeHeader the value of the Content-Type header
 */
export function getMultiPartFormBoundary(contentTypeHeader: string) {
  const matches = MULTIPART_FORMDATA_REG_EX.exec(contentTypeHeader);
  if (matches) {
    return matches[2];
  }
  return undefined;
}

/**
 * Given a multipart-form/data encoded body & a boundary delimiter, this will return an
 * array of IPartSummary interfaces describing the parts.
 *
 * @param boundary The boundary delimiter string used in a multipart/form-data message
 * @param body The text body.
 */
export function getMultiPartFormParts(boundary: string, body: string): IPartSummary[] {
  boundary = '--' + boundary;
  const firstBoundaryRegExString = `^((\\r\\n)?${boundary}\\s*?\\r\\n)`;
  const firstBoundaryRegEx = new RegExp(firstBoundaryRegExString, 'gm');

  // captures:
  //    $1:  optional header section
  //    $2:  CRLFCRLF seperating headers & body, or if no headers, separating boundary marker & body
  //    $3:  body section
  //    $4:  next boundary marker
  //    $5:  content after closing boundary
  //    $6:  "--" indicating end of multipart bodies.  If this part matches, then we've found the last boundary delimiter
  //    $7:  trailing whitespace
  const partRegExString = `([\\s\\S]*?)(\\r\\n\\r\\n)([\\s\\S]*?)(\\r\\n${boundary})((--)|(\\s*?\\r\\n))`;
  const partRegEx = new RegExp(partRegExString, 'gm');

  const firstBoundary = firstBoundaryRegEx.exec(body);
  const partSummaries: IPartSummary[] = [];
  if (firstBoundary) {
    // start searching for parts immediately after the first boundary reg ex match.  Back up two to include trailing \r\n
    partRegEx.lastIndex = firstBoundaryRegEx.lastIndex - 2;
    while (true) {
      const part = partRegEx.exec(body);
      if (!part) {
        break;
      }
      const headerSectionLength = part[1] ? part[1].length : 0;
      const bodyStartIndex = part.index + headerSectionLength + part[2].length;
      const convertedHeaders = part[1] ? convertRawHeaders(part[1]) : {};
      const bodySectionLength = part[3] ? part[3].length : 0;
      partSummaries.push({
        headers: convertedHeaders,
        bodyStartIndex: part.index + part[1].length + part[2].length,
        bodyEndIndex: bodyStartIndex + bodySectionLength,
        bodyLength: bodySectionLength
      });

      if (part[6]) {
        // found trailing -- after boundary, which indicates we're done
        break;
      }
    }
  }
  return partSummaries;
}

interface GlimpsePerformanceResourceTiming extends PerformanceResourceTiming {
  __glimpse_requestId?: string;
}

/**
 * Asynchronously attempts to find a PerformanceResourceTiming object that matches the given initiatorType and url and
 * whose startTime is within two milliseconds of `expectedStart` parameter. Specified callback will invoked with the
 * matching PerformanceResourceTiming object, or with undefined if unable to find matching object.
 * Will attempt lookup up to 8 times, with a delay increasing exponentially from 1ms up to 256ms, for a maximum delay of 511ms
 *
 * @param initiatorType A RegExp that will match the expected value for the initiatorType of the target PerformanceResourceTiming instance
 * @param url - expected URL of the target PerformanceResourceTiming instance
 * @param expectedStart - the expected start time for the target PerformanceResourceTiming instance
 * @param cb - callback to invoke when target is found, or when max number of lookup attempts has been made
 */
export function tryFindResourceTimingObject(requestId: string, initiatorType: RegExp, url: string, expectedStart: number, cb: (p: PerformanceResourceTiming) => void) {
  if (!(performance && performance.getEntriesByType)) {
    setTimeout(() => cb(undefined));
    return;
  }

  const maxDelay = 1024; // milliseconds
  let delay = 1;

  function tryGet() {
    function computeDelta(p2: PerformanceResourceTiming): number {
      return Math.abs(p2.startTime - expectedStart);
    }

    // try to find this request
    const entries: PerformanceResourceTiming[] = performance.getEntriesByType('resource');
    let target: GlimpsePerformanceResourceTiming = undefined;
    let candidates: GlimpsePerformanceResourceTiming[] = [];
    for (let i = 0; i < entries.length; i++) {
      const curr = entries[i] as GlimpsePerformanceResourceTiming;
      if (requestId && curr.__glimpse_requestId === requestId) {
        // if we've already matched this PerformanceResourceTiming with this specific request, then use it
        target = curr;
        break;
      }
      else if (initiatorType.test(curr.initiatorType) && curr.name === url && expectedStart <= curr.startTime && !curr.__glimpse_requestId) {
        candidates.push(curr);
      }
    }

    if (!target) {
      candidates.sort((a, b) => {
        const deltaA = computeDelta(a);
        const deltaB = computeDelta(b);

        // sort by smallest delta between startTime & expectedStart
        return (deltaA - deltaB);
      });

      if (candidates.length > 0) {
        target = candidates[0];
        target.__glimpse_requestId = requestId;
      }
    }

    if (target || delay >= maxDelay) {
      cb(target);
    }
    else {
      delay *= 2;
      setTimeout(tryGet, delay);
    }

    return target;
  }

  setTimeout(tryGet, delay);
}



// WEBPACK FOOTER //
// ./src/inspectors/HttpRequestUtils.ts