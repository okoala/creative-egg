'use strict';

import { IAgent } from '../IAgent';
import { ProxyBase } from './ProxyBase';

export class KnexProxy extends ProxyBase {
  public init(agent: IAgent, knex) {
    return this.setupProxy(agent, knex);
  }

  private setupProxy(agent: IAgent, knex) {
    return function knexProxy() {
      const realKnex = knex.apply(this, arguments);

      const onStart = function onKnexStart(builder) {
        const context = agent.providers.contextManager.currentContext();
        // NOTE: If there is no current context, the queries are being made outside of any outstanding
        // HTTP request (such as during application startup) and these should not be logged.
        if (context) {
          const startTime = new Date();
          const queries = [];

          builder.on('query', function onKnexQuery(query) {
            queries.push(query);

            agent.broker.createAndSendMessage(
              {
                commandText: query.sql,
                commandType: '',
                commandParameters: '',
                commandMethod: '',
                commandIsAsync: true,
                commandStartTime: startTime,
              },
              ['before-execute-command'], undefined /*indices*/, context);
          });

          builder.on('end', function onKnexEnd() {
            const endTime = new Date();

            queries.forEach(function forQuery() {
              agent.broker.createAndSendMessage(
                {
                  commandHadException: false,
                  commandEndTime: endTime,
                  commandDuration: endTime.getTime() - startTime.getTime(),
                  commandOffset: startTime.getTime() - context.startTime.getUnixTimestamp(),
                },
                ['after-execute-command'], undefined /*indices*/, context);
            });
          });
        }
      };

      realKnex.client.on('start', onStart);

      return realKnex;
    };
  }

  public get moduleName() { return 'knex'; }

  public get forceLoadModule(): boolean {
    return false;
  }
}
