'use strict';

import { IContext } from './IContextManager';

export interface IScriptManager {
    getScriptTagsForCurrentRequest(context: IContext): string;
    injectScript(htmlBody: string, payload: string): string;
}
