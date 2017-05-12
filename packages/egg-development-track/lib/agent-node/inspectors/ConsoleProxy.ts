import { IAgent } from '../IAgent';
import { IContextManager } from '../messaging/IContextManager';
import { ProxyBase } from './ProxyBase';
import { IStackHelper, IStackFrame } from './util/StackHelper';
import { IConfigSettings } from '../../common';
import { IMessageConverter } from '../messaging/IMessageConverter';
import { IMessage } from '../messaging/IMessage';
import { GuidHelper } from '../util/GuidHelper';
import { NodeVersionHelper } from '../util/NodeVersionHelper';

import util = require('util');

/* tslint:disable:no-any */

/**
 * Interface that represents key logic for a proxy
 */
interface IProxyMethod {
  (originalThis: object, originalArgs: any, realMethod: any, stackTopFunction: () => any): any;
}

interface ILogWriteMessage {
  message: string | any[];
  level: string;
  library: string;
  category: string;
  tokenSupport?: string;
  frames?: IStackFrame[];
}

interface ITimerBeginMessage extends ILogWriteMessage {
  correlationId: string;
  correlationName: string;
}

interface ITimerEndMessage extends ITimerBeginMessage {
  duration: number;
}

interface ITimerInfo {
  correlationId: string;
  hrtime: [number, number];
}

export enum LogLevel { Debug, Log, Info, Warning, Error }

/**
 * The Proxy class for Console logging
 */
export class ConsoleProxy extends ProxyBase {

  private agent: IAgent;
  private contextManager: IContextManager;
  private stackHelper: IStackHelper;
  private configSettings: IConfigSettings;
  private messageConverter: IMessageConverter;
  private _realConsoleMethods: any = {};
  private _realConsolePrototypeMethods: any = {};
  private _suppressLogWriteMessage: boolean = false;
  private _suppressGlimpseMessage: boolean = false;
  private _timerLabels = new Map();

  /**
   * Init the proxy.
   */
  public init(agent: IAgent, consoleModule: any): any {

    this.agent = agent;
    this.contextManager = agent.providers.contextManager;
    this.stackHelper = agent.providers.stackHelper;
    this.configSettings = agent.providers.configSettings;
    this.messageConverter = agent.providers.messageConverter;

    this.addProxy('assert', 'assert', this.assert, consoleModule);
    // debug() is not supported on Node, but leave here for client platforms where it may be supported.fs
    this.addProxy('debug', 'debug', this.debug, consoleModule);
    this.addProxy('error', 'warn', this.error, consoleModule);  // route "error" calls through to warn
    // let "trace" calls go through our override, and then through "warn"
    this.addProxy('trace', 'trace', this.trace, consoleModule);
    this.addProxy('info', 'log', this.info, consoleModule);  // route "info" calls through to log
    this.addProxy('log', 'log', this.log, consoleModule);
    this.addProxy('warn', 'warn', this.warn, consoleModule);
    this.addProxy('dir', 'dir', this.dir, consoleModule);
    this.addProxy('time', 'time', this.time, consoleModule);
    this.addProxy('timeEnd', 'timeEnd', this.timeEnd, consoleModule);

    return consoleModule;
  }

  public get forceLoadModule(): boolean {
    // we need to load the Console module asap,
    // as users can call the console.* methods without calling require('console').
    return true;
  }

  public get moduleName() { return 'console'; }

  /**
   * helper method that will send the appropriate glimpse message and invoke the underlying console method
   */
  private proxyHelper(originalThis, originalArgs, realMethod, logLevel: LogLevel, stackTopFunction) {
    if (this.contextManager.isWithinContext() && !this._suppressGlimpseMessage) {
      const numStackFrames = this.configSettings.get('instrumentor.console.stack-capture.size', 10);
      const stack = this.stackHelper.captureStack(stackTopFunction, numStackFrames);
      const msg: IMessage<ILogWriteMessage> = this.createLogWriteMessage(
        Array.prototype.slice.call(originalArgs, 0), logLevel, undefined, true,
      );
      this.sendMessage(msg, stack);
    }
    return realMethod.apply(originalThis, originalArgs);
  }

  /**
   * logic to send messages for Console.assert()
   */
  private assert(originalThis, originalArgs, realMethod, stackTopFunction) {
    if ((!originalArgs || !originalArgs[0]) && this.contextManager.isWithinContext()) {
      const numStackFrames = this.configSettings.get('instrumentor.console.stack-capture.size', 10);
      const stack = this.stackHelper.captureStack(stackTopFunction, numStackFrames);
      const msg: IMessage<ILogWriteMessage> = this.createLogWriteMessage(
        Array.prototype.slice.call(originalArgs, 1),
        LogLevel.Error,
        undefined,
        true,
      );
      this.sendMessage(msg, stack);
    }
    return realMethod.apply(originalThis, originalArgs);
  }

  /**
   * Logic to send glimpse messages for Console.dir()
   */
  private dir(originalThis, originalArgs, realMethod, stackTopFunction) {
    if (this.contextManager.isWithinContext()) {
      const numStackFrames = this.configSettings.get('instrumentor.console.stack-capture.size', 10);
      const stack = this.stackHelper.captureStack(stackTopFunction, numStackFrames);

      //
      // string json-parseable.
      //
      // let options = originalArgs[1] || {};
      // options = (<any>Object).assign({ customInspect: false }, options);
      // const stringData = util.inspect(originalArgs[0], options);
      // const objData = JSON.parse(stringData);

      const objData = originalArgs[0];
      const msg: IMessage<ILogWriteMessage> = this.createLogJSONMessage([objData], LogLevel.Log, undefined);
      this.sendMessage(msg, stack);
    }
    return realMethod.apply(originalThis, originalArgs);
  }

  /**
   * logic to support glimpse messages for timeEnd
   */
  private time(originalThis, originalArgs, realMethod, stackTopFunction) {
    const hrtime = process.hrtime();
    const returnValue = realMethod.apply(originalThis, originalArgs);

    const label: string = originalArgs[0] as string;
    const correlationId = GuidHelper.newGuid();
    const timerInfo: ITimerInfo = { correlationId, hrtime };
    this._timerLabels.set(label, timerInfo);

    if (this.contextManager.isWithinContext()) {
      const numStackFrames = this.configSettings.get('instrumentor.console.stack-capture.size', 10);
      const stack = this.stackHelper.captureStack(stackTopFunction, numStackFrames);
      const msg: IMessage<ITimerBeginMessage> = this.createTimerBeginMessage(label, timerInfo.correlationId);
      this.sendMessage(msg, stack);
    }
    return returnValue;
  }

  /**
   * logic to support glimpse messages for timeEnd
   */
  private timeEnd(originalThis, originalArgs, realMethod, stackTopFunction) {
    this._suppressLogWriteMessage = true;
    let returnValue;
    try {
      returnValue = realMethod.apply(originalThis, originalArgs);
    } finally {
      this._suppressLogWriteMessage = false;
    }

    const label: string = originalArgs[0] as string;
    let timerInfo: ITimerInfo;
    timerInfo = this._timerLabels.get(label);

    let correlationId: string;
    let millis: number;
    if (timerInfo) {
      const hrtime = process.hrtime(timerInfo.hrtime);
      // prior to v6.0, node runtime wouldn't delete the timer label when timeEnd was called.
      // replicate that behavior here.
      //  See https://github.com/nodejs/node/pull/5901
      //      https://github.com/nodejs/node/blob/master/doc/changelogs/CHANGELOG_V6.md#notable-changes-14
      if (NodeVersionHelper.getMajor() >= 6) {
        this._timerLabels.delete(label);
      }
      correlationId = timerInfo.correlationId;
      millis = hrtime[0] * 1000 + hrtime[1] / 1e6;
    } else {
      correlationId = GuidHelper.newGuid();
      millis = 0;
    }

    if (this.contextManager.isWithinContext()) {
      const numStackFrames = this.configSettings.get('instrumentor.console.stack-capture.size', 10);
      const stack = this.stackHelper.captureStack(stackTopFunction, numStackFrames);
      const msg: IMessage<ITimerEndMessage> = this.createTimerEndMessage(label, correlationId, millis);
      this.sendMessage(msg, stack);
    }

    return returnValue;
  }

  /**
   * This is a no-op for now as Node doesn't support debug, but browsers do, so we'll leave this here for when this
   * proxy is hooked up on browser clients.
   */
  private debug(originalThis, originalArgs, realMethod, stackTopFunction) {
    return this.proxyHelper(originalThis, originalArgs, realMethod, LogLevel.Error, stackTopFunction);
  }

  /**
   * Logic to send glimpse messages for Console.error()
   */
  private error(originalThis, originalArgs, realMethod, stackTopFunction) {
    return this.proxyHelper(originalThis, originalArgs, realMethod, LogLevel.Error, stackTopFunction);
  }

  /**
   * Logic to send glimpse messages for Console.error()
   */
  private trace(originalThis, originalArgs, realMethod, stackTopFunction) {
    if (this.contextManager.isWithinContext()) {
      const numStackFrames = this.configSettings.get('instrumentor.console.stack-capture.size', 10);
      const stack = this.stackHelper.captureStack(stackTopFunction, numStackFrames);
      const args = Array.prototype.slice.call(originalArgs, 0);

      // add 'Trace:' prefix to the message to conform w/ what is output from Node
      if (args[0] === undefined) {
        args[0] = 'Trace:';
      } else {
        args[0] = 'Trace: ' + args[0];
      }

      const msg: IMessage<ILogWriteMessage> = this.createLogWriteMessage(args, LogLevel.Debug, undefined, true);
      msg.types.push('log-display-callstack');
      this.sendMessage(msg, stack);
    }

    // underlying trace implementation will call console.error -
    // we want to suppress message generation when that happens so
    // we don't have two glimpse messages for the same event.
    try {
      this._suppressGlimpseMessage = true;
      return realMethod.apply(originalThis, originalArgs);
    } finally {
      this._suppressGlimpseMessage = false;
    }
  }

  /**
   * Logic to send glimpse messages for Console.info()
   */
  private info(originalThis, originalArgs, realMethod, stackTopFunction) {
    return this.proxyHelper(originalThis, originalArgs, realMethod, LogLevel.Info, stackTopFunction);
  }

  /**
   * Logic to send glimpse messages for Console.log()
   */
  private log(originalThis, originalArgs, realMethod, stackTopFunction) {
    if (this._suppressLogWriteMessage) {
      realMethod.apply(originalThis, originalArgs);
    } else {
      return this.proxyHelper(originalThis, originalArgs, realMethod, LogLevel.Log, stackTopFunction);
    }
  }

  /**
   * Logic to send glimpse messages for Console.warn()
   */
  private warn(originalThis, originalArgs, realMethod, stackTopFunction) {
    return this.proxyHelper(originalThis, originalArgs, realMethod, LogLevel.Warning, stackTopFunction);
  }

  private createTimerBeginMessage(label: string, correlationId: string): IMessage<ITimerBeginMessage> {
    const message = this.createLogWriteMessage(
      undefined, LogLevel.Debug, undefined, false, 'log-timespan-begin', 'correlation-begin', 'correlation',
    );
    const payload: ITimerBeginMessage = message.payload as ITimerBeginMessage;

    // for timer begin, the message is a string and it is the label.
    payload.message = label;
    payload.correlationId = correlationId;
    return message as IMessage<ITimerBeginMessage>;
  }

  private createTimerEndMessage(label: string, correlationId, durationInMilliseconds): IMessage<ITimerEndMessage> {
    const message = this.createLogWriteMessage(
      undefined, LogLevel.Debug, undefined, false, 'log-timespan-end', 'correlation-end', 'correlation',
    );
    const payload: ITimerEndMessage = message.payload as ITimerEndMessage;
    payload.message = label;
    payload.correlationId = correlationId;
    payload.duration = durationInMilliseconds;
    return message as IMessage<ITimerEndMessage>;
  }

  /**
   * create a 'log-json' glimpse message
   */
  private createLogJSONMessage(logArguments: any[], level: LogLevel, category: string): IMessage<ILogWriteMessage> {
    return this.createLogWriteMessage(logArguments, level, category, false, 'log-json');
  }

  /**
   * create a 'log-write' glimpse message
   */
  private createLogWriteMessage(
    logArguments: any[],
    level: LogLevel,
    category: string,
    isPrintf: boolean,
    ...extraTypes: string[],
  ): IMessage<ILogWriteMessage> {
    const self = this;
    let message: IMessage<ILogWriteMessage>;
    const context = this.contextManager.currentContext();
    if (context) {
      const messageTypes = [];
      const payload: ILogWriteMessage = {
        message: logArguments,
        level: LogLevel[level],
        library: 'Node.js Console',
        category,
      };

      if (extraTypes) {
        messageTypes.push(...extraTypes);
      }

      if (isPrintf) {
        messageTypes.push('log-token-printf');
        payload.tokenSupport = 'node';
      }
      messageTypes.push('log-write');
      message = self.messageConverter.createMessageEnvelope<ILogWriteMessage>(messageTypes, undefined, context);
      message.payload = payload;
    }
    return message;
  }

  private sendMessage<ILogWriteMessage>(messageEnvelope: IMessage<ILogWriteMessage>, stackFrames: IStackFrame[]) {
    const self = this;

    this.stackHelper.mapFrames(stackFrames, (mappedFrames) => {
      // tslint:disable-next-line:no-any
      (messageEnvelope.payload as any).frames = mappedFrames;
      messageEnvelope.types.push('call-stack');

      const transformedMessage = self.messageConverter.transformMessageForTransit(
        messageEnvelope, messageEnvelope.payload,
      );
      this.agent.broker.sendMessage(transformedMessage);
    });
  }

  /**
   *  helper method to hookup up a proxy method on the Console object.  This helper
   *  accounts for the fact that there could potentially be two different sets of
   *  log methods, the 'console.*' methods, and then the Console.prototype.* methods.
   */
  private addProxy(methodToProxy: string, methodToCall: string, proxyFunction: IProxyMethod, consoleModule) {
    const self = this;

    if (this._realConsoleMethods[methodToProxy] || this._realConsolePrototypeMethods[methodToProxy]) {
      throw new Error(util.format('Attempted to add proxy twice for method %s', methodToProxy));
    }

    if (consoleModule[methodToProxy]) {
      this._realConsoleMethods[methodToProxy] = consoleModule[methodToProxy];
      const p1 = function p1() {
        return proxyFunction.call(self, this, arguments, self._realConsoleMethods[methodToCall], p1);
      };
      consoleModule[methodToProxy] = p1;
    }

    if (consoleModule.Console.prototype[methodToProxy]) {
      this._realConsolePrototypeMethods[methodToProxy] = consoleModule.Console.prototype[methodToProxy];
      const p2 = function p2() {
        return proxyFunction.call(self, this, arguments, self._realConsolePrototypeMethods[methodToCall], p2);
      };
      consoleModule.Console.prototype[methodToProxy] = p2;
    }
  }
}
