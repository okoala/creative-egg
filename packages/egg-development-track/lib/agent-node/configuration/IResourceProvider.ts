'use strict';

export interface IResourceProvider {
  getResourceDefinitions(): { [key: string]: string };
}
