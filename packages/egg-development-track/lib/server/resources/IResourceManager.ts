import { IResource } from './IResource';

import * as http from 'http';

export interface IResourceManager {
    resources: IResource[];
    getUriTemplates(baseUri: string): { [key: string]: string };
    register(resource: IResource);
    match(req: http.ServerRequest);
}
