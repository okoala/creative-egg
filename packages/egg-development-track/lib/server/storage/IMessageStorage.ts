'use strict';

import { IMessage } from '../messaging/IMessage';
import { IMessageStorageContext } from './IMessageStorageContext';

export interface IMessageStorage {
    contexts: { [key: string]: IMessageStorageContext };

    persist(message: IMessage): void;
}
