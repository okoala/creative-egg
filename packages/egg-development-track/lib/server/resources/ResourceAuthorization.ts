import {
  IResourceAuthorization,
  IResourceAuthorizationCallback,
  IResourceTypeAuthorization,
} from './IResourceAuthorization';

import * as http from 'http';

export class ResourceAuthorization implements IResourceAuthorization {
  private _agentAuthorizations: IResourceTypeAuthorization[] = [];
  private _clientAuthorizations: IResourceTypeAuthorization[] = [];

  public addAgentAuthorization(authorization: IResourceTypeAuthorization): void {
    this._agentAuthorizations.push(authorization);
  }

  public addClientAuthorization(authorization: IResourceTypeAuthorization): void {
    this._clientAuthorizations.push(authorization);
  }

  public canExecute(req: http.IncomingMessage, resourceType: string, callback: IResourceAuthorizationCallback): void {
    switch (resourceType) {
      case 'agent':
        this.canExecuteType(req, this._agentAuthorizations, callback);
        break;

      case 'client':
        this.canExecuteType(req, this._clientAuthorizations, callback);
        break;

      default:
        callback(
          new Error(`Unable to execute a request for the unrecognized resource type '${resourceType}'.`),
          /* canExecute: */ false,
        );
        break;
    }
  }

  private canExecuteType(
    req: http.IncomingMessage,
    authorizations: IResourceTypeAuthorization[],
    callback: IResourceAuthorizationCallback): void {
    if (authorizations.length === 0) {
      callback(/* error: */ undefined, /* canExecute: */ true);
    } else {
      const authorizationsCopy = authorizations.slice();

      const next = function next() {
        const authorization = authorizationsCopy.shift();

        if (authorization) {
          authorization(req, (err, canExecute) => {
            if (err || !canExecute) {
              callback(err, canExecute);
            } else {
              next();
            }
          });
        } else {
          callback(/* err: */ undefined, /* canExecute: */ true);
        }
      };

      next();
    }
  }
}
