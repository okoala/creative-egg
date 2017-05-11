import * as http from 'http';
import * as _ from 'lodash';

import { IResource } from './IResource';
import { IResourceManager } from './IResourceManager';
import { UriTemplate } from './UriTemplate';

export class ResourceManager implements IResourceManager {
  private resourceTable: { [key: string]: IResource } = {};

  public get resources(): IResource[] {
    return _.values<IResource>(this.resourceTable);
  }

  public getUriTemplates(baseUri: string): { [key: string]: string } {
    const resources = _(this.resources)
      .filter((resource) => resource.templateName !== undefined)
      .reduce<{ [key: string]: string }>(
      (result, resource) => {
        result[resource.templateName] = UriTemplate.fromResource(baseUri, resource);
        return result;
      },
      {});

    return resources;
  }

  public register(resource: IResource) {
    this.resourceTable[resource.name] = resource;
  }

  public match(req: http.ServerRequest) {
    const startingSegment = this.getStartingSegment(req.url);
    if (startingSegment.segment) {
      const resource = this.resourceTable[startingSegment.segment];
      if (resource) {
        // change the url to be inline with the behavior of a app.use
        req.url = startingSegment.remaining;

        const parameters = undefined; // TODO: need to pull out this part
        return {
          parameters,
          resource,
        };
      }
    }

    return undefined;
  }

  private getStartingSegment(path: string) {
    let startingSegment = '';
    let remaining = '';

    const firstSlash = path.indexOf('/', 1);
    if (firstSlash > 0) {
      startingSegment = path.substring(1, firstSlash);
      remaining = path.substring(firstSlash, path.length);
    } else {
      startingSegment = path.substring(1, path.length);
      remaining = '/';
    }

    return {
      segment: startingSegment,
      remaining,
    };
  }
}
