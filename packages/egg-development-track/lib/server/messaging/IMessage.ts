'use strict';

import { IMessageContext } from './IMessageContext';

export interface IMessage {
    context: IMessageContext;
    id: string;
    ordinal: number;
    payload: string;
    types: string[];

    /* tslint:disable:no-any */
    indices?: { [key: string]: any };
    /* tslint:enable:no-any */
}
