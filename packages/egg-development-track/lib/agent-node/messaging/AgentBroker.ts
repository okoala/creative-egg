'use strict';

import { IAgent } from '../IAgent';
import { IAgentBroker } from './IAgentBroker';
import { ITransmittableMessage } from './IMessage';
import { IContext } from './IContextManager';
import { IMessageConverter } from './IMessageConverter';

export class AgentBroker implements IAgentBroker {

    private messageConverter: IMessageConverter;

    public constructor(private agent: IAgent) {
        this.messageConverter = agent.providers.messageConverter;
    }

    public createAndSendMessage<T>(data: T, types: string[], indices: Object, context: IContext) {
        if (!context) {
            context = this.agent.providers.contextManager.currentContext();
        }

        if (context) {
            const message = this.messageConverter.createMessage(data, types, indices, context);
            this.sendMessage(message);
        }
    }

    /**
     * send the given message
     */
    public sendMessage(message: ITransmittableMessage) {
        this.agent.providers.messagePublisher.publishMessages([message]);
    }
}
