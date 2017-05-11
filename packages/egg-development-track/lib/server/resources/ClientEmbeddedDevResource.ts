import { Resource as ClientResource } from './ClientEmbeddedResource';
import { IServer } from './../IServer';

/**
 * resource for the /glimpse/client-dev route.  This will serve up the dev build of the client
 */
export class Resource extends ClientResource {
    constructor(server: IServer) {
        super(server, '-dev', 'dev');
    }
}
