import { Resource as ClientResource } from './ClientEmbeddedResource';
import { IServer } from './../IServer';

/**
 * Resource for the /glimpse/client route.  This is the default route for accessing
 * the client.    This will serve up the dev build if config setting
 * 'use.embedded.dev.builds' is true, and the prod build otherwise.
 */
export class Resource extends ClientResource {
    constructor(server: IServer) {
        const useDevBuild = server.providers.configSettings.get('use.embedded.dev.builds', false);
        const suffix = useDevBuild ? 'dev' : 'prod';
        super(server, '', suffix);
    }
}
