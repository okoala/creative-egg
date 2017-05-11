import { IConsoleEvent, NOTIFY_CONSOLE_EVENT_OCCURED } from '../tracing/proxies/ConsoleProxy';

import { IInspector } from './IInspector';
import { IMessagePublisher, IMessage } from '../MessagePublisher';
import { IProxyEvent } from '../tracing/IProxyEvent';
import tracing from '../tracing/Tracing';
import { getGuid } from '../common/GeneralUtilities';
import { addCorrelationBegin, addCorrelationEnd, addOffset } from '../common/MessageMixins';
import { getStackTrace } from '../common/CallStackUtilities';

export enum LogMessageTypes {
  json,
  xml,
  table,
  assert,
  count,
  timespan_begin,
  timespan_end,
  group_begin,
  group_end
}

interface IConsoleData {
  method: string;
  arguments: any[]; // tslint:disable-line:no-any
  offset: number;
}

interface InspectionMethods {
  [key: string]: {
    level: string;
    nullByPass?: boolean,
    tokenTypeByPass?: boolean,
    processor?: (message: IMessage, data: IConsoleData) => boolean | void;
  };
}

export class ConsoleInspector implements IInspector {
  private countMap = {};

  private stack = {
    group: [],
    profile: []
  };

  private map = {
    time: {}
  };

  private mapNull = {
    time: undefined
  };

  public methods: InspectionMethods = {
    assert: {
      level: 'Error',
      processor: (message, data) => this.assert(message, data)
    },
    count: {
      level: 'Debug',
      processor: (message, data) => this.count(message, data),
      tokenTypeByPass: true
    },
    debug: {
      level: 'Debug',
      nullByPass: true
    },
    dir: {
      level: 'Log',
      nullByPass: true,
      processor: (message, data) => this.dir(message, data, LogMessageTypes.json),
      tokenTypeByPass: true
    },
    dirxml: {
      level: 'Log',
      nullByPass: true,
      processor: (message, data) => this.dir(message, data, LogMessageTypes.xml),
      tokenTypeByPass: true
    },
    error: {
      level: 'Error',
      nullByPass: true
    },
    group: {
      level: undefined,
      processor: (message, data) => this.groupStart(message, data, false)
    },
    groupCollapsed: {
      level: undefined,
      processor: (message, data) => this.groupStart(message, data, true)
    },
    groupEnd: {
      level: undefined,
      processor: (message, data) => this.groupEnd(message, data)
    },
    info: {
      level: 'Info',
      nullByPass: true
    },
    log: {
      level: 'Log',
      nullByPass: true
    },
    profile: {
      level: 'Debug',
      processor: (message, data) => this.profileStart(message, data),
      tokenTypeByPass: true
    },
    profileEnd: {
      level: 'Debug',
      processor: (message, data) => this.profileEnd(message, data),
      tokenTypeByPass: true
    },
    table: {
      level: 'Log',
      nullByPass: true,
      processor: (message, data) => this.applyType(message, data, LogMessageTypes.table),
      tokenTypeByPass: true
    },
    time: {
      level: 'Debug',
      processor: (message, data) => this.mapStart('time', message, data, LogMessageTypes.timespan_begin),
      tokenTypeByPass: true
    },
    timeEnd: {
      level: 'Debug',
      processor: (message, data) => this.mapEnd('time', message, data, LogMessageTypes.timespan_end),
      tokenTypeByPass: true
    },
    timeStamp: {
      level: 'Debug',
      processor: (message, data) => this.timeStamp(message, data),
      tokenTypeByPass: true
    },
    trace: {
      level: 'Debug',
      processor: (message, data) => this.trace(message, data)
    },
    warn: {
      level: 'Warning',
      nullByPass: true
    }
  };

  public init(messagePublisher: IMessagePublisher) {
    tracing.on(NOTIFY_CONSOLE_EVENT_OCCURED, (event: IProxyEvent) => {
      const data: IConsoleEvent = event.data;

      const payload: IConsoleData = {
        method: data.method,
        arguments: data.arguments,
        offset: event.offset
      };

      this.publishMessage(messagePublisher, payload);
    });
  }

  private publishMessage(messagePublisher: IMessagePublisher, data: IConsoleData) {
    const info = this.methods[data.method];

    // in the case where we have no args or a nullByPass is in effect then we shouldn't log messages
    if (!data.arguments || data.arguments.constructor !== Array || (info.nullByPass && data.arguments.length === 0)) {
      return;
    }

    // build base message
    const payload = {
      message: data.arguments,
      library: 'Browser Console',
      level: info.level
    };
    const message = messagePublisher.createMessage('log-write', payload);
    addOffset(data.offset, message);

    // run through any custom processors
    let suppressMessage = false;
    if (info.processor) {
      suppressMessage = info.processor(message, data) || false;
    }

    // normalize token format
    if (!info.tokenTypeByPass) {
      this.deriveTokenType(message);
    }

    if (!suppressMessage) {
      getStackTrace((frames) => {
        message.payload.frames = frames;
        message.types.push('call-stack');
        messagePublisher.publishMessage(message);
      });
    }
  }

  // api specific targets

  private count(message, data: IConsoleData) {
    // chrome treats no args the same as ''
    const label = data.arguments.length > 0 ? String(data.arguments[0]) : '';

    // for record the label
    message.payload.message = label;

    // track ongoing progress
    let currentCount = (this.countMap[label] || 0) + 1;
    this.countMap[label] = currentCount;

    // record the applyType
    this.applyType(message, data, LogMessageTypes.count);

    // record the addition count data
    message.payload.count = currentCount;
  }

  private assert(message, data: IConsoleData) {
    const assertion = data.arguments.length > 0 ? data.arguments[0] : false;
    // if we have no args|null|undefined|0 we will treat it as a fail
    if (assertion) {
      return true;
    }
    else {
      message.payload.message = message.payload.message.slice(1);
    }
  }

  private dir(message, data: IConsoleData, type: LogMessageTypes) {
    let newArgs: any = data.arguments.length > 0 ? [data.arguments[0]] : data.arguments; // tslint:disable-line:no-any

    let processAsDir = false;

    let value = newArgs[0];
    if (type === LogMessageTypes.xml && value && typeof value === 'object' && value.getElementsByTagName && 'outerHTML' in value) {
      const nodeCount = value.getElementsByTagName('*').length;
      // Safety checks to deal with large data payloads
      if (nodeCount > 100) {
        newArgs = 'Node with more than `100` decendents aren\'t supported.';
      }
      else {
        value = value.outerHTML;
        if (value.length > 2500) {
          newArgs = 'Node with more than `2500` characters aren\'t supported.';
        }
        else {
          newArgs[0] = value;
        }
      }

      processAsDir = true;
    }
    else if (type === LogMessageTypes.json) {
      processAsDir = true;
    }

    // this is setup this way so that in non valid `LogMessageTypes.xml` cases, we essentually
    // treat it as plain console.log
    if (processAsDir) {
      // we only care about the first arg in this case
      message.payload.message = newArgs;

      this.applyType(message, data, type);
    }
    else {
      this.deriveTokenType(message);
    }
  }

  private timeStamp(message, data: IConsoleData) {
    this.getAndApplyLabel(message, data);
  }

  private groupStart(message, data: IConsoleData, isCollapsed: boolean) {
    message.payload.isCollapsed = isCollapsed;

    this.stackStart('group', message, data, LogMessageTypes.group_begin);
  }

  private groupEnd(message, data: IConsoleData) {
    return this.stackEnd('group', message, data, LogMessageTypes.group_end);
  }

  private profileStart(message, data: IConsoleData) {
    this.getAndApplyLabel(message, data);

    this.stackStart('profile', message, data, LogMessageTypes.timespan_begin);
  }

  private profileEnd(message, data: IConsoleData) {
    this.getAndApplyLabel(message, data);

    const result = this.stackEnd('profile', message, data, LogMessageTypes.timespan_end);

    return result;
  }

  private trace(message, data: IConsoleData) {
    // for trace methods include 'log-display-callstack' message type so callstack will be displayed
    message.types.push('log-display-callstack');

    // make a copy of the message since we're going to modify it.
    message.payload.message = Array.prototype.slice.call(message.payload.message, 0);
    if (message.payload.message[0] === undefined) {
      message.payload.message[0] = 'Trace:';
    }
    else {
      message.payload.message[0] = 'Trace: ' + message.payload.message[0];
    }
  }

  // common/shared helpers

  private applyType(message, data: IConsoleData, mixin: LogMessageTypes) {
    const type = LogMessageTypes[mixin].replace('_', '-');

    message.types.push('log-' + type);
  }

  private getAndApplyLabel(message, data: IConsoleData) {
    const label = data.arguments.length > 0 ? String(data.arguments[0]) : undefined;

    // for mapEnds we dump the args and just use the label
    message.payload.message = label;

    return label;
  }

  private stackStart(type, message, data: IConsoleData, mixin: LogMessageTypes) {
    const group = this.coreStart(message, data, mixin);

    this.stack[type].push(group);
  }

  private stackEnd(type, message, data: IConsoleData, mixin: LogMessageTypes) {
    const group = this.stack[type].pop();
    if (group) {
      this.coreEnd(group, message, data, mixin);
    }
    else {
      return true;
    }
  }

  private mapStart(type, message, data: IConsoleData, mixin: LogMessageTypes) {
    const label = this.getAndApplyLabel(message, data);

    const group = this.coreStart(message, data, mixin);

    if (label !== undefined) {
      this.map[type][label] = group;
    }
    else {
      this.mapNull[type] = group;
    }
  }

  private mapEnd(type, message, data: IConsoleData, mixin: LogMessageTypes) {
    const label = this.getAndApplyLabel(message, data);

    let group = label !== undefined ? this.map[type][label] : this.mapNull[type];
    if (group) {
      if (label !== undefined) {
        delete this.map[type][label];
      }
      else {
        this.mapNull[type] = undefined;
      }
    }
    else {
      // if no match is found we should match to page load
      group = { correlationId: getGuid(), time: 0 };
    }

    this.coreEnd(group, message, data, mixin);
  }

  private coreStart(message, data: IConsoleData, mixin: LogMessageTypes) {
    const correlationId = getGuid();
    const time = data.offset;

    addCorrelationBegin(correlationId, message);

    // add action begin specific data
    this.applyType(message, data, mixin);

    return {
      correlationId: correlationId,
      time: time
    };
  }

  private coreEnd(group, message, data: IConsoleData, mixin: LogMessageTypes) {
    const time = data.offset;

    // add action begin specific data
    this.applyType(message, data, mixin);

    addCorrelationEnd(group.correlationId, time - group.time, message);
  }

  private deriveTokenType(message) {
    if (message.payload.message !== undefined
      && message.payload.message !== null // tslint:disable-line:no-null-keyword
      && message.payload.message !== 'string') {
      message.types.push('log-token-printf');
      message.payload.tokenSupport = 'browser';
    }
  }
}



// WEBPACK FOOTER //
// ./src/inspectors/ConsoleInspector.ts