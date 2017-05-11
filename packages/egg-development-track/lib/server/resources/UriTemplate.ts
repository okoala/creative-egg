import { IConfigSettings } from '../../common';
import { IResource } from './IResource';

import * as express from 'express';

export class UriTemplate {
  public static getBaseUri(configSettings: IConfigSettings, req: express.Request) {
    const protocol = configSettings.get('server.protocol', req.protocol);
    const baseUri = `${protocol}://${req.get('host')}/glimpse`;

    return baseUri;
  }

  public static fromResource(baseUri: string, resource: IResource): string {
    return baseUri + '/' + resource.name + '/' + (resource.uriTemplate || '');
  }
}
