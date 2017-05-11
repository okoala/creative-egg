'use strict';

import { IContext } from './IContextManager';
import { IMessage } from './IMessage';
import { GuidHelper } from './../util/GuidHelper';
import { IDateTime } from './../configuration/IDateTime';
import { IMessageConverter } from './IMessageConverter';

export class MessageConverter implements IMessageConverter {
    private static i = 0;

    public constructor(private dateTimeService: IDateTime) {
    }

    public createMessage<T>(data: T, types: string[], indices: Object, context: IContext): IMessage<string> {
        const message = this.createMessageEnvelope(types, indices, context);
        const transformedMessage = this.transformMessageForTransit(message, data);
        return transformedMessage;
    };

    public transformMessageForTransit<T>(message: IMessage<T>, data): IMessage<string> {
        const payload = {
            id: message.id,
            payload: data,
            ordinal: message.ordinal,
            context: message.context,
            types: message.types,
            agent: message.agent,
            offset: message.offset
        };

        const transformedMessage: IMessage<string> = {
            context: message.context,
            id: message.id,
            ordinal: message.ordinal,
            payload: undefined,
            types: message.types,
            offset: message.offset,
            sent: message.sent,
            agent: message.agent
        };

        // don't include undefined properties, or they won't pass json schema validation
        if (message.indices) {
            transformedMessage.indices = message.indices;
        }

        transformedMessage.payload = JSON.stringify(payload);
        return transformedMessage;
    }

    public createMessageEnvelope<T>(types: string[], indices: Object, context: IContext): IMessage<T> {
        const message: IMessage<T> = {
            id: GuidHelper.newGuid(false),
            context: {
                id: context.id,
                type: context.type
            },
            ordinal: ++MessageConverter.i,
            types: types,
            offset: this.dateTimeService.now.diff(context.startTime),
            payload: undefined,
            agent: { source: 'server'},
            sent: false
        };

        // don't include undefined properties, or they won't pass json schema validation
        if (indices) {
            message.indices = indices;
        }
        return message;
    }
}
