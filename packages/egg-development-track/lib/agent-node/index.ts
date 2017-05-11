'use strict';

import tracing from './tracing/Tracing';
export { tracing };

import * as ExpressEvents from './tracing/module_instrumentors/ExpressEvents';
export { ExpressEvents };

export { ContextManagerProvider } from './messaging/ContextManagerProvider';

// need to import IAgent to get around some errors when generating typescript definitions
//tslint:disable-next-line:no-unused-variable
import { IAgent } from './IAgent';
import { createGlobalNodeAgent } from './Agent';
const agent = createGlobalNodeAgent();
export { agent };
