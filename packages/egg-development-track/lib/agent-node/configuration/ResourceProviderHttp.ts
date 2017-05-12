'use strict';

import { glimpseServerRequest } from '../messaging/GlimpseServerRequest';

import { IDeferredInitializationManager } from '../IDeferredInitializationManager';
import { IResourceProvider } from './IResourceProvider';

interface IResourceProviderCallback {
  (resources: { [key: string]: string }): void;
}

export class ResourceProviderHttp implements IResourceProvider {
  private static EXPORT_CONFIG_RESOURCE_NAME = 'export-config';

  private resources: { [key: string]: string };

  public constructor(
    private metadataUri: string,
    private deferredInitializationManager: IDeferredInitializationManager,
  ) {
    deferredInitializationManager.onInit(done => {
      glimpseServerRequest(this.metadataUri, (metadataErr, metadataRes, metadataBody) => {
        if (metadataErr) {
          return done(metadataErr);
        }

        const metadata = JSON.parse(metadataBody);

        const exportConfigUri = metadata.resources[ResourceProviderHttp.EXPORT_CONFIG_RESOURCE_NAME];

        if (exportConfigUri) {
          glimpseServerRequest(exportConfigUri, (exportErr, exportRes, exportBody) => {
            if (exportErr) {
              return done(exportErr);
            }

            this.resources = JSON.parse(exportBody);

            done();
          });
        } else {
          this.resources = {};
          done();
        }
      });
    });
  }

  public getResourceDefinitions(): { [key: string]: string } {
    return this.resources;
  }
}
