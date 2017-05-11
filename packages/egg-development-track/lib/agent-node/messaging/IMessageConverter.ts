'use strict';

import { IContext } from './IContextManager';
import { ITransmittableMessage, IMessage } from './IMessage';

export interface IMessageConverter {
    createMessage<T>(data: T, types: string[], indices: Object, context: IContext): ITransmittableMessage;
    transformMessageForTransit<T>(message: IMessage<T>, data): ITransmittableMessage;
    createMessageEnvelope<T>(types: string[], indices: Object, context: IContext): IMessage<T>;
}
