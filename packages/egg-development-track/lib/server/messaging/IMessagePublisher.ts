'use strict';

import { IMessage } from './IMessage';

export interface IMessageStreamDone {
    ();
}

export interface IMessageStreamCallback {
    (err: Error, message: IMessage);
}

export interface IMessageStreamSubscription {
    contextId?: string;
    types?: string[];
    callback: IMessageStreamCallback;
    done: IMessageStreamDone;
}

export interface IMessagePublisher {
    publishMessages(messages: IMessage[]);
    streamMessages(contextId?: string, types?: string[], callback?: IMessageStreamCallback): IMessageStreamSubscription;
}
