'use strict';

import { IMessageStorageContext } from './IMessageStorageContext';
import { IRequestIndices } from './IRequestIndices';

export interface IRequestStorageContext extends IMessageStorageContext {
    indices: IRequestIndices;
}
