import * as http from 'http';

export interface IResourceAuthorizationCallback {
    (err: Error, canExecute?: boolean): void;
}

export interface IResourceTypeAuthorization {
    (req: http.IncomingMessage, callback: IResourceAuthorizationCallback): void;
}

export interface IResourceAuthorization {
    addAgentAuthorization(authorization: IResourceTypeAuthorization): void;
    addClientAuthorization(authorization: IResourceTypeAuthorization): void;

    canExecute(req: http.IncomingMessage, resourceType: string, callback: IResourceAuthorizationCallback): void;
}
