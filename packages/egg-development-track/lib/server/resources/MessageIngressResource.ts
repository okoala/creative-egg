import { IServer } from '../IServer';
import { IMessagePublisher } from '../messaging/IMessagePublisher';
import { IResource } from './IResource';

export class Resource implements IResource {
  public name = 'message-ingress';
  public templateName = 'messageIngressTemplate';
  public type = 'agent';

  private messagePublisher: IMessagePublisher;

  public constructor(server?: IServer) {
    if (server) {
      this.init(server.providers.messagePublisher);
    }
  }

  public init(messagePublisher: IMessagePublisher) {
    this.messagePublisher = messagePublisher;
  }

  public invoke(req, res) {
    // TODO: need to respond with processed message IDs (see #51)
    // TODO: need to validate posting (see #51)
    this.messagePublisher.publishMessages(req.body);
    res.sendStatus(202);
  }
}
