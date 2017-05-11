import { Resource as ClientResource } from './ClientEmbeddedResource';
import { IServer } from './../IServer';

/**
 * resource for the /glimpse/client-prod route.  This will serve up the prod build of the client
 */
export class Resource extends ClientResource {
    constructor(server: IServer) {
        super(server, '-prod', 'prod');
    }
}
