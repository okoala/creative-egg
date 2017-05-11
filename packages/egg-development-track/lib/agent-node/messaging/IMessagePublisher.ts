'use strict';

import { ITransmittableMessage } from './IMessage';

export interface IMessagePublisher {
    publishMessages(messages: ITransmittableMessage[]): void;
}
