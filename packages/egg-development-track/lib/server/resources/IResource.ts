'use strict';

import * as http from 'http';

/**
 * Endpoints which are registered at the '/glimpse' endpoint.
 */
export interface IResource {
    name: string;
    uriTemplate?: string;
    templateName?: string;
    type: string; //'client' | 'agent';
    invoke(req: http.ServerRequest, res: http.ServerResponse, next?: Function): void;
}
