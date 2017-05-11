import glimpseAgent from './agent-node';
import glimpseServer from './server';

import * as _ from 'lodash';

module.exports = {
  agent: glimpseAgent.agent,
  server: glimpseServer.server,

  init: function init(options) {
    var serverOptions = {};

    if (options && options.server) {
      serverOptions = _.assign({}, serverOptions, options.server);
    }

    var agentOptions = { server: glimpseServer.server };

    if (options && options.agent) {
      agentOptions = _.assign({}, agentOptions, options.agent);
    }

    glimpseServer.server.init(serverOptions);
    glimpseAgent.agent.init(agentOptions);
  }
};
