'use strict';

import { instance as server } from './Server';
import { setupProxy } from './hosting/host-express';

// TODO: Move this to server type once hosting has been converted to TypeScript.
// there's an error that occurs when running glimpse.agent tests if we call
// require('./hosting/host-express') from with Server.ts.  Need to investigate
// what is going on.
const oldInit = server.init;
server.init = function newInit() {
    oldInit.apply(this, arguments);
    setupProxy();
};

module.exports.server = server;
