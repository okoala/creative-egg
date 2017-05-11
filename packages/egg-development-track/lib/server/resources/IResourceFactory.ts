'use strict';

import { IResource } from './IResource';
import { IServer } from '../IServer';

export interface IResourceFactory {
    new(server: IServer): IResource;
}
