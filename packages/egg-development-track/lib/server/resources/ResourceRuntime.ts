import { createAuthorizationInvocationFailedError, IErrorReportingService } from '../../common';
import { IResourceAuthorization } from './IResourceAuthorization';
import { IResourceManager } from './IResourceManager';

import * as express from 'express';

export class ResourceRuntime {
  public constructor(
    private resourceAuthorization: IResourceAuthorization,
    private resourceManager: IResourceManager,
    private errorReportingService: IErrorReportingService,
  ) { }

  public processRequest(req: express.Request, res: express.Response, next?: () => void) {
    const result = this.resourceManager.match(req);

    if (result) {
      this.resourceAuthorization.canExecute(req, result.resource.type, (err, canExecute) => {
        if (err) {
          this.errorReportingService.reportError(createAuthorizationInvocationFailedError(err));

          res.sendStatus(500);
        } else if (canExecute) {
          result.resource.invoke(req, res, next, result.parameters);
        } else {
          // TODO: Review, do we want a 401, 404 or continue users pipeline (see #81)
          res.sendStatus(401);
        }
      });
    } else {
      res.sendStatus(404);
    }
  }
}
