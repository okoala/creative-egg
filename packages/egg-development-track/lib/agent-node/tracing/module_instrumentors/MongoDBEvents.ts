'use strict';

export const EVENT_MONGODB_COLLECTION_INSERT = 'invoke|pre|module:/mongodb.collection#insert';
export const EVENT_MONGODB_COLLECTION_INSERT_METHODS = 'invoke|post|module:/mongodb.collection#insertMethods';
export const EVENT_MONGODB_COLLECTION_DELETE_METHODS = 'invoke|post|module:/mongodb.collection#deleteMethods';
export const EVENT_MONGODB_COLLECTION_UPDATE_METHODS = 'invoke|post|module:/mongodb.collection#updateMethods';
export const EVENT_MONGODB_COLLECTION_COUNT = 'invoke|post|module:/mongodb.collection#count';
export const EVENT_MONGODB_READ_START = 'notify|Module:/mongodb#startRead';
export const EVENT_MONGODB_READ_RECORD = 'notify|Module:/mongodb#readRecord';
export const EVENT_MONGODB_READ_END = 'notify|Module:/mongodb#endRead';
export const EVENT_MONGODB_CORE_INVOKE_PRE_MONGODB_CORE_SERVER_COMMAND = 'invoke|pre|module:/mongodb-core.server#command';
export const EVENT_MONGODB_CORE_INVOKE_PRE_MONGODB_CORE_POOL_WRITE = 'invoke|pre|module:/mongodb-core.pool#write';
export const EVENT_MONGODB_CORE_INVOKE_PRE_MONGODB_CORE_CURSOR_NEXT = 'invoke|pre|module:/mongodb-core.cursor#next';
