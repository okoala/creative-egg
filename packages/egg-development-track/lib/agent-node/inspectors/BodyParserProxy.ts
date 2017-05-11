'use strict';

import { IAgent } from '../IAgent';
import { ProxyBase } from './ProxyBase';
import { IMiddlewareFunction, MiddlewareWrapper } from './util/MiddlewareWrapper';

export class BodyParserProxy extends ProxyBase {

    public get moduleName(): string { return 'body-parser'; };

    public init(agent: IAgent, module) {
        // NOTE: Calling the module function will result in a 'deprecated' warning.
        //       We need to keep the function in the new module for compatibility purposes so the warning, while annoying, must be ignored.

        /* tslint:disable no-any */
        const newModule: any = BodyParserProxy.wrapParserFactory(module, 'bodyParser', 'Body Parser');
        /* tslint:enable no-any */

        // NOTE: The original module explicitly defines these exports as read-only properties so we must create a new module (function).

        newModule.json = BodyParserProxy.wrapParserFactory(module.json, 'json', 'JSON Body Parser');
        newModule.raw = BodyParserProxy.wrapParserFactory(module.raw, 'raw', 'Raw Body Parser');
        newModule.text = BodyParserProxy.wrapParserFactory(module.text, 'text', 'Text Body Parser');
        newModule.urlencoded = BodyParserProxy.wrapParserFactory(module.urlencoded, 'urlencoded', 'URL-Encoded Body Parser');

        return newModule;
    }

    private static wrapParserFactory(parserFactory, name: string, displayName: string): IMiddlewareFunction {
        return function newParserFactory() {
            const parser = <IMiddlewareFunction> parserFactory.apply(this, arguments);

            MiddlewareWrapper.attachMetadata(parser, name, displayName, 'body-parser');

            return parser;
        };
    }
}
