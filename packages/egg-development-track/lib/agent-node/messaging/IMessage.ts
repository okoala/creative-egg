'use strict';

import { IMessageContext } from './IMessageContext';

export interface ITransmittableMessage extends IMessage<string> {
}

export interface IAgentType {
    source: string;
}

export interface IMessage<T> {
    context: IMessageContext;
    id: string;
    ordinal: number;
    payload: T;
    types: string[];
    /** number of milliseconds from the start of this request that this message was produced */
    offset: number;

    /* tslint:disable:no-any */
    indices?: { [key: string]: any };
    /* tslint:enable:no-any */

    sent: boolean;
    agent: IAgentType;
}
