'use strict';

import { glimpseServerRequest } from './GlimpseServerRequest';
import { IMessagePublisher } from './IMessagePublisher';
import { IResourceProvider } from '../configuration/IResourceProvider';

export class MessagePublisherHttp implements IMessagePublisher {
  private static messageIngressTemplate = 'messageIngressTemplate';

  public constructor(private resourceProvider: IResourceProvider) {
  }

  public publishMessages(messages) {
    const resources = this.resourceProvider.getResourceDefinitions();
    const options = {
      uri: resources[MessagePublisherHttp.messageIngressTemplate],
      method: 'POST',
      json: true,
      body: messages,
    };

    glimpseServerRequest(options.uri, options, function onResponse(err) {
      if (err) {
        throw err;
      }

      for (let i = 0; i < messages.length; i++) {
        messages[i].sent = true;
      }
    });
  }
}
