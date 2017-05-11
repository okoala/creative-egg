import { AgentType } from '../timeline/TimelineInterfaces';
import { ILogWritePayload } from 'modules/messages/schemas/ILogWritePayload';
import { ILogGroupBeginPayload } from 'modules/messages/schemas/ILogGroupBeginPayload';
import { ICorrelationPayload } from 'modules/messages/schemas/ICorrelationPayload';

//
// STATE INTERFACES
//

export interface ILoggingPersistedState {
    filters: ILoggingFiltersPersistedState;
}

export interface ILoggingFiltersPersistedState {
    agent: ILoggingFilterValue;
    level: ILoggingFilterValue;
}

export interface ILoggingFilterValue {
    [key: number]: boolean;
}

//
// SELECTOR INTERFACES
//

export interface ILoggingMessage {
    contextId: string;
    messageId: string;
    index: number;
    ordinal: number;
    types: string[];
    offset: number;
    payload: ILogGroupBeginPayload & ILogWritePayload & ICorrelationPayload;
    agent: AgentType;
    correlations?: {
        begin?: ILoggingMessage;
        end?: ILoggingMessage;
        isBegin?: boolean;
        isEnd?: boolean;
        isGroup?: boolean;
        ends?: ILoggingMessage[];
    };
    group?: {
        isActive: boolean;
        begin: ILoggingMessage;
        end: ILoggingMessage;
        isClosed: boolean;
        isEnding: boolean;
    }[];
    level: LoggingMessageLevel;
    isCollapsed?: boolean;
    isVisible?: boolean;
}

export interface ILoggingAgentCount {
    name: string;
    count: number;
    agent: AgentType;
}

export interface ILoggingLevelCount {
    name: string;
    count: number;
    level: LoggingMessageLevel;
}

export interface ILoggingLevelSummary extends ILoggingLevelCount {
    isShown: boolean;
}

export interface ILoggingAgentSummary extends ILoggingAgentCount {
    isShown: boolean;
}

export enum LoggingMessageLevel {
    Error,
    Warning,
    Info,
    Debug,
    Log
}



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/logging/LoggingInterfaces.ts