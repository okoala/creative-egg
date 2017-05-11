'use strict';

import { IMessagePublisher } from '../messaging/IMessagePublisher';
import { IResource } from './IResource';
import { IServer } from '../IServer';

export class Resource implements IResource {
    private messagePublisher: IMessagePublisher;

    public constructor(server?: IServer) {
        if (server) {
            this.init(server.providers.messagePublisher);
        }
    }

    public init(messagePublisher: IMessagePublisher) {
        this.messagePublisher = messagePublisher;
    }

    public name = 'message-stream';
    public uriTemplate = '{?types,contextId}';
    public type = 'client';
    public invoke(req, res) {
        // TODO: Still need to complete pings (see #45)

        const types = req.query.types ? req.query.types.split(',') : [ ];
        const contextId = req.query.contextId;

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        const subscription = this.messagePublisher.streamMessages(
            contextId,
            types,
            (err, message) => {
                if (err) {
                    return err;
                }

                if (message) {
                    let payload = '';

                    payload += 'id: ' + message.id + '\n';
                    payload += 'event: message\n';
                    payload += 'data: [' + message.payload + ']\n';
                    payload += '\n';

                    res.write(payload);
                    res.flush();
                }
                else {
                    res.end();
                }
            }
        );

        req.on('close', function done() {
            subscription.done();
        });

        // ping logic to keep alive connection
        let pingId = 0;
        function ping() {
            let payload = 'id: ' + pingId++ + '\n';
                payload += 'event: ping\n';
                payload += 'data: []\n';
                payload += '\n';

            res.write(payload);
            res.flush();
        }

        // start pinging immediately,
        // and then on 20 second intervals
        ping();
        const keepAlive = setInterval(ping, 20000);

        res.on('close', function close() {
            clearInterval(keepAlive);
        });
    };
}
