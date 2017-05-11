'use strict';

import { IAgent } from '../IAgent';
import { ProxyBase } from './ProxyBase';
import { IMiddlewareFunction, MiddlewareWrapper } from './util/MiddlewareWrapper';

import * as _ from 'lodash';

export class MorganProxy extends ProxyBase {
    public get forceLoadModule(): boolean { return false; }

    public get moduleName(): string { return 'morgan'; };

    public init(agent: IAgent, module) {
        const newModule = function newModule() {
            const logger = <IMiddlewareFunction> module.apply(this, arguments);

            MiddlewareWrapper.attachMetadata(logger, 'logger', 'Morgan Logger', 'morgan');

            return logger;
        };

        // NOTE: Accessing the 'default' property of the module will result in a 'deprecated default format' warning.
        //       We need to keep the property on the new module for compatibility purposes so the warning, while annoying, must be ignored.

        _.assign(newModule, module);

        return newModule;
    }
}
