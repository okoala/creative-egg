'use strict';

import { IMessage } from '../messaging/IMessage';
import { IRequestFilters } from './IRequestFilters';

export interface IMessageQuery {
    queryMessages(contextId?: string, types?: string[]): IMessage[];

    queryRequests(filters?: IRequestFilters, types?: string[]): IMessage[];
}
