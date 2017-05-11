import { ajax } from 'nanoajax';
import { getGuid } from './common/GeneralUtilities';
import { addOffset } from './common/MessageMixins';
import { getMessageIngressUrl, getRequestId } from './common/RequestUtilities';

export interface IMessage {
  context: {
    id: string,
    type: string,
  };
  id: string;
  ordinal: number;
  payload;
  types: string[];
  agent: {
    source: 'browser';
  };
  offset: number;
}

interface IRange {
  start: number;
  end: number;
}

/**
 * break a list of messages into group so that the groups are under maxSize.
 * If any individual message is over maxSize, it will be grouped on its own.
 * returns an of IRange instances, where start is inclusive & end is exclusive.
 *
 * Exported for test purposes.
 */
export function chunkMessages(messageBodies: string[], maxSize: number): IRange[] {
  const ranges: IRange[] = [];
  let sum = 0;
  let lastStart = 0;

  for (let i = 0; i < messageBodies.length; i++) {
    sum += messageBodies[i].length;
    if (messageBodies[i].length > maxSize) {
      if (lastStart !== i) {
        // when a single message is over the limit, we want to send previous messages in their own batch
        ranges.push({ start: lastStart, end: i });
      }
      ranges.push({ start: i, end: i + 1 });
      lastStart = i + 1;
      sum = 0;
    }
    else if (sum > maxSize) {
      ranges.push({ start: lastStart, end: i });
      lastStart = i;
      sum = messageBodies[i].length;
    }
  }

  if (lastStart < messageBodies.length) {
    ranges.push({ start: lastStart, end: messageBodies.length });
  }

  return ranges;
}

/**
 * given an array of serialized message bodies & array of ranges,
 * break them into JSON-serialized sub-arrays as defined by the ranges.
 *
 * Exported for test purposes.
 */
export function serializeRanges(messageBodies: string[], ranges: IRange[]): string[] {
  const payloads: string[] = [];

  for (const range of ranges) {
    if (range.end > range.start) {
      const subBodies = messageBodies.slice(range.start, range.end);
      const payload = '[' + subBodies.join(',') + ']';
      payloads.push(payload);
    }
  }
  return payloads;
}

export interface IMessagePublisher {
  createMessage(type: string | string[], payload): IMessage;

  publishMessage(message: IMessage): void;

  createAndPublishMessage(type: string, payload): void;
}

export class MessagePublisher implements IMessagePublisher {
  private static timeout = 250;
  private ordinal = 1;
  private messageQueue: IMessage[] = [];
  private messageTimeout = undefined;

  public createMessage(type: string | string[], payload): IMessage {
    const types = Array.isArray(type) ? type : [type];
    const msg: IMessage = {
      id: getGuid(),
      types,
      payload,
      context: {
        id: getRequestId(),
        type: 'Request'
      },
      ordinal: this.ordinal++,
      agent: {
        source: 'browser'
      },
      offset: 0
    };

    addOffset(performance.now(), msg);
    return msg;

  }

  public publishMessage(message: IMessage): void {
    // finish getting message ready for sending
    message.payload = JSON.stringify(message); // tslint:disable-line:no-string-literal

    // add messages to queu
    this.messageQueue.push(message);

    // only setup the timeout if we need to
    if (!this.messageTimeout) {
      this.messageTimeout = setTimeout(() => {
        this.messageTimeout = undefined;
        this.sendData();
      }, MessagePublisher.timeout);
    }
  };

  public createAndPublishMessage(type: string, payload): void {
    this.publishMessage(this.createMessage(type, payload));
  };

  private sendPayload(body) {
    // send data with all the data that we have batched up
    ajax({
      url: getMessageIngressUrl(),
      method: 'POST',
      body: body
    }, () => {
      // not doing anything atm
    });
  }

  private sendData() {
    // we'll chunk the pooled messages into individual requests to try stay under
    // some size limit for http payloads.

    const maxBodySize = 100000;
    const bodies: string[] = [];

    this.messageQueue.forEach((m) => {
      bodies.push(JSON.stringify(m));
    });

    const ranges = chunkMessages(bodies, maxBodySize);
    const payloads = serializeRanges(bodies, ranges);

    payloads.forEach((payload) => {
      this.sendPayload(payload);
    });

    this.messageQueue = [];
  }
}



// WEBPACK FOOTER //
// ./src/MessagePublisher.ts