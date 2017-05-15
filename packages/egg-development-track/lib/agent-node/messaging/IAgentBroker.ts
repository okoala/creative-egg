'use strict';

import { IContext } from './IContextManager';
import { ITransmittableMessage } from './IMessage';

export interface IAgentBroker {
  createAndSendMessage<T>(data: T, types: string[], indices: object, context: IContext): void;
  sendMessage(message: ITransmittableMessage): void;
}
