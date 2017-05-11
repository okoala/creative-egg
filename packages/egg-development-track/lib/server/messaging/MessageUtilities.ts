'use strict';

import { IMessage } from './IMessage';

export class MessageUtilities {
    public static toPayloadJson(messages: IMessage[]): string {
        if (messages) {
            return '[' + messages.map(message => message.payload).join(',') + ']';
        }
        else {
            return '[]';
        }
    }
}
