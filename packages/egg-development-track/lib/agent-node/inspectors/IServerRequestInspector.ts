import { IncomingMessage, ServerResponse } from 'http';

import { IAgent } from '../IAgent';
import { DateTimeValue } from '../configuration/DateTimeValue';

/**
 *  A summary of a single part in a multi-part/form body
 */
export interface IPartSummary {
  headers: { [key: string]: string[] }; // map of header name to an array of header value.
  bodyStartIndex?: number;  // index in the multi-part payload of the first character of this part's body.
  bodyEndIndex?: number;    // index in the multi-part payload of the first character  **after** this part's body.
  bodyLength?: number;      // length of body in bytes
}

export interface IServerRequestInspector {
  init(agent: IAgent): void;

  requestStart(
    req: IncomingMessage,
    res: ServerResponse,
    requestStartTime: DateTimeValue,
  );

  // tslint:disable-next-line:no-any
  requestEnd(
    req: IncomingMessage,
    res: ServerResponse,
    content: any[],
    size: number,
    requestStartTime: DateTimeValue,
    multiPartSummaries?: IPartSummary[],
  ): void;

  responseStart(
    req: IncomingMessage,
    res: ServerResponse,
    responseStartTime: DateTimeValue,
  ): void;

  // tslint:disable-next-line:no-any
  responseEnd(
    req: IncomingMessage,
    res: ServerResponse,
    content: any[],
    size: number,
    responseStartTime: DateTimeValue,
  ): void;
}
