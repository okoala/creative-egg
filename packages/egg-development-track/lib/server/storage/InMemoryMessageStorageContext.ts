'use strict';

import { IMessage } from '../messaging/IMessage';
import { IMessageStorageContext, MessageStorageContextType } from './IMessageStorageContext';

export class InMemoryMessageStorageContext implements IMessageStorageContext {
    private _type: MessageStorageContextType;

    constructor(type: MessageStorageContextType) {
        this._type = type;
    }

    public messages: IMessage[] = [ ];

    public get type(): MessageStorageContextType {
        return this._type;
    }

    public persist(message: IMessage): void {
        this.messages.push(message);
    }
}
