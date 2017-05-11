'use strict';

import { IMessage } from '../messaging/IMessage';

export enum MessageStorageContextType {
    Generic,
    Request
}

export interface IMessageStorageContext {
    messages: IMessage[];
    type: MessageStorageContextType;
}
