import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import includes from 'lodash/includes';
import isObjectLike from 'lodash/isObjectLike';

import ExpandCollapseButton from 'routes/requests/components/ExpandCollapseButton';
import ExpandableText from 'routes/requests/components/ExpandableText';
import { ICallStackPayload, CallStackType } from 'modules/messages/schemas/ICallStackPayload';
import { getVisibleLoggingMessages, getCountableMessageCount, getCountableFilteredMessageCount } from '../LoggingSelectors';
import { getSelectedContextId } from 'routes/requests/RequestsSelector';
import { templateBatchProcessor } from 'common/util/TemplateProcessor';
import { ILoggingMessage, LoggingMessageLevel } from '../LoggingInterfaces';
import { IStoreState } from 'client/IStoreState';

import commonStyles from 'common/components/Common.scss';
import styles from './Logging.scss';
import { Icon } from 'common/components/Icon';
import MessageRowTarget from 'common/components/MessageRowTarget';

import AgentTypeIcon from 'common/components/AgentTypeIcon';
import LoggingLevelIcon from './LoggingLevelIcon';
import ExpandCollapseAllBar from 'routes/requests/components/ExpandCollapseAllBar';
import JsonTree from 'routes/requests/components/JsonTree';
import JsonTable from 'routes/requests/components/JsonTable';
import LoggingLabel from './LoggingLabel';
import LoggingStatement from './LoggingStatement';
import LoggingTimeSpan from './LoggingTimeSpan';
import LoggingFilterBarContainer from './LoggingFilterBar';
import StackFrame from 'common/components/StackFrame';
import { TimeDuration } from 'common/components/TimeDuration';
import { LogCountType } from 'modules/messages/schemas/ILogCountPayload';
import { LogWriteType } from 'modules/messages/schemas/ILogWritePayload';
import { LogTimeSpanBeginType } from 'modules/messages/schemas/ILogTimeSpanBeginPayload';
import { LogTimeSpanEndType } from 'modules/messages/schemas/ILogTimeSpanEndPayload';

export interface ILoggingProps {
    contextId: string;
    filteredMessages: ILoggingMessage[];
    totalMessageCount: number;
    filteredMessageCount: number;
}

export class LoggingView extends React.Component<ILoggingProps, {}> {
    public render() {
        const ordinalWidth = 40;
        const levelWidth = 80;
        const messageWidth = '75%';
        const offsetWidth = 80;
        const locationWidth = '25%';

        const { filteredMessages, contextId } = this.props;

        return (
            <div className={classNames(styles.logView, commonStyles.contextSection)}>
                <div className={commonStyles.tabViewHeader}>
                    <h3 className={commonStyles.detailTitle}>{this.getHeaderText()}</h3>
                    <div className={commonStyles.tabViewFilterHeader}>
                        <LoggingFilterBarContainer />
                        <div className={styles.logViewExpandCollapseAll}>
                            <ExpandCollapseAllBar parentElementId={['logs']} requestId={contextId} />
                        </div>
                    </div>
                    <table className={commonStyles.table}>
                        <thead>
                            <tr>
                                <th width={ordinalWidth}><AgentTypeIcon className={styles.logAgentIcon} />#</th>
                                <th width={levelWidth}><Icon target={undefined} className={styles.logLevelIcon} />Level</th>
                                <th width={messageWidth}><Icon target={undefined} className={styles.logTimeSpanIcon} />Message</th>
                                <th width={offsetWidth}>From start</th>
                                <th width={locationWidth}>Location</th>
                            </tr>
                            <tr><td colSpan={5} className={commonStyles.tableHeadSpacer}></td></tr>
                        </thead>
                    </table>
                </div>
                <div className={styles.logViewTableContainer}>
                    <table className={styles.logViewTable}>
                        <thead>
                            <tr>
                                <th width={ordinalWidth} />
                                <th width={levelWidth} />
                                <th width={messageWidth} />
                                <th width={offsetWidth} />
                                <th width={locationWidth} />
                            </tr>
                        </thead>
                        <tbody>
                            {templateBatchProcessor(filteredMessages, LoggingView.typesOrder, LoggingView.templates, { contextId, component: this })}
                            {this.renderNoEvents()}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    private renderNoEvents() {
        const { filteredMessageCount, totalMessageCount } = this.props;

        let result;
        if (totalMessageCount === 0) {
            result = <span className={styles.logMessageNoEvents}>No messages detected.</span>;
        }
        else if (filteredMessageCount === 0) {
            result = <span className={styles.logMessageNoEvents}>No messages shown. Try changing the filter above.</span>;
        }

        return result ? <tr><td colSpan={5}>{result}</td></tr> : result;
    }

    private static typesOrder = [
        LogCountType,
        'log-json',
        'log-xml',
        'log-table',
        LogTimeSpanBeginType,
        LogTimeSpanEndType,
        'log-group-begin',
        'log-group-end',
        'log-token-printf',
        LogWriteType
    ];

    private static layouts = {
        master: function (model: ILoggingMessage, index, template) {
            return (
                <MessageRowTarget ordinal={model.ordinal} elementKey={model.messageId}>
                    <td>
                        <a name={model.ordinal.toString()}>{LoggingView.renderValueWithIcon(model.ordinal, <AgentTypeIcon agentType={model.agent} className={styles.logAgentIcon} />)}</a>
                    </td>
                    <td className={commonStyles.trimText}>
                        {LoggingView.renderValueWithIcon(LoggingMessageLevel[model.level], <LoggingLevelIcon level={model.level} />)}
                    </td>
                    <td className={styles.logContent}>
                        {LoggingView.renderGroupingElements(model)}
                        {template(model, index)}
                    </td>
                    <td className={styles.logDurationColumn}>
                        <TimeDuration duration={model.offset} />
                    </td>
                    <td>
                        {LoggingView.renderLocation(model.types, model)}
                    </td>
                </MessageRowTarget>
            );
        }
    };

    private static timespanTemplate(isStart, model, index) {
        return LoggingView.layouts.master(model, index, () => {
            return LoggingView.renderValueWithIcon(
                <LoggingTimeSpan message={model} wasStarted={isStart} />,
                <Icon target={Icon.paths.Clock} className={styles.logTimeSpanIcon} pathClassName={styles.logTimeSpanIconPath} />
            );
        });
    }

    private static groupTemplate(isStart, model, index, props) {
        return LoggingView.layouts.master(model, index, () => {
            const getLabel = (message) => {
                return model.types.indexOf('log-token-printf') > -1
                    ? <LoggingStatement content={message} contextId={props.contextId} messageId={model.messageId} />
                    : <span>{message}</span>;
            };

            return LoggingView.renderValueWithIcon(
                <LoggingLabel message={model.payload.message} getLabel={getLabel} />,
                <ExpandCollapseButton elementId={['logs', model.messageId]} expanded={!model.isCollapsed} requestId={props.contextId} title="Group" />
            );
        });
    }

    private static templates = {
        [LogTimeSpanBeginType]: LoggingView.timespanTemplate.bind(undefined, true),
        [LogTimeSpanEndType]: LoggingView.timespanTemplate.bind(undefined, false),
        'log-group-begin': LoggingView.groupTemplate.bind(undefined, true),
        'log-group-end': LoggingView.groupTemplate.bind(undefined, false),
        'log-table': function (model, index, props) {
            if (!JsonTable.canRenderMessage(model.payload.message)) {
                return LoggingView.templates['log-json'](model, index, props);
            }

            return LoggingView.layouts.master(model, index, () => {
                return LoggingView.renderValueWithIcon(
                    <JsonTable className={styles.logContentTable} model={model} isEvenRow={!!(index % 2)} />,
                    <ExpandCollapseButton title="Table" elementId={['logs', model.messageId]} expanded={!model.isCollapsed} requestId={props.contextId} />,
                    styles.logTableStyle);
            });
        },
        'log-count': function (model, index, models) {
            return LoggingView.layouts.master(model, index, () => {
                return LoggingView.renderValueWithIcon(<span><LoggingLabel message={model.payload.message} />: <span className="token tokenInteger">{model.payload.count}</span></span>);
            });
        },
        'log-json': function (model, index, props) {
            let data = model.payload.message;
            if (model.types.indexOf('log-json') > -1) {
                data = data[0];
            }

            return LoggingView.layouts.master(model, index, () => {
                return LoggingView.renderValueWithIcon(<span data-glimpse-object><JsonTree data={data} elementId={['logs', model.messageId]} requestId={props.contextId} /></span>);
            });
        },
        'log-xml': function (model, index, props) {
            let content = model.payload.message;
            if (Array.isArray(content)) {
                content = content[0];
            }

            return LoggingView.layouts.master(model, index, () => {
                return LoggingView.renderExpandableText(props.contextId, model.messageId, content);
            });
        },
        'log-token-printf': function (model, index, props) {
            return LoggingView.layouts.master(model, index, () => {
                let allowExpansion;

                if (Array.isArray(model.payload.message)) {
                    allowExpansion = model.payload.message.every(param => !isObjectLike(param));
                }

                let text = <LoggingStatement content={model.payload.message} tokenSupport={model.payload.tokenSupport} contextId={props.contextId} messageId={model.messageId} />;
                text = LoggingView.appendCallstack(text, model);

                if (allowExpansion) {
                    return LoggingView.renderExpandableText(props.contextId, model.messageId, text);
                }
                else {
                    return LoggingView.renderValueWithIcon(text);
                }
            });
        },
        'log-write': function (model, index, props) {
            const message = model.payload.message;
            const type = typeof message;

            // we are attempting to be nice to those who just send `log-write` messages
            if (type === 'object') {
                return LoggingView.templates['log-json'](model, index, props);
            }

            // if not an object the treat as a string
            return LoggingView.layouts.master(model, index, () => {
                const text = type === 'string' || message === undefined || message === null ? message : String(message); // tslint:disable-line:no-null-keyword
                return LoggingView.renderExpandableText(props.contextId, model.messageId, text);
            });
        }
    };

    private getHeaderText() {
        const { totalMessageCount, filteredMessageCount } = this.props;
        const events = totalMessageCount === 1 ? 'message' : 'messages';
        if (totalMessageCount === filteredMessageCount) {
            return `${totalMessageCount} ${events}`;
        }
        else {
            return `${filteredMessageCount} of ${totalMessageCount} ${events}`;
        }
    }

    private static renderValueWithIcon(value, icon?, valueClassName?: string) {
        const actualIcon = icon || LoggingView.renderDefaultIcon();

        return (
            <div className={classNames(styles.logIconColumn, valueClassName)}>
                {actualIcon}
                {value}
            </div>
        );
    }

    private static renderExpandableText(contextId, messageId, text) {
        return <ExpandableText elementId={['logs', messageId]} requestId={contextId} text={text} />;
    }

    private static renderDefaultIcon() {
        return <Icon target={undefined} className={styles.logTimeSpanIcon} />;
    }

    private static renderLocation(types: string[], message: ILoggingMessage) {
        const callStack = includes(types, CallStackType) ? (message.payload as any) as ICallStackPayload : undefined; // tslint:disable-line:no-any
        const topStackFrame = callStack && callStack.frames && callStack.frames.length ? callStack.frames[0] : undefined;

        return <StackFrame frame={topStackFrame} />;
    }

    private static renderGroupingElements(model: ILoggingMessage) {
        if (model.group) {
            return model.group.map((group, i) => {
                if (!group.isClosed) {
                    return <div key={i} className={classNames(styles.logGroup, { [styles.logGroupLine]: group.isActive, [styles.logGroupLineEnd]: group.isEnding })}></div>;
                }
            });
        }
    }

    private static appendCallstack(component, model) {
        if (model.types.indexOf('log-display-callstack') > -1 && model.payload.frames && model.payload.frames.length > 0) {
            let callstackData = '';
            for (let i = 0; i < model.payload.frames.length; i++) {
                const currFrame = model.payload.frames[i];
                if (currFrame.functionName) {
                   callstackData += `    at ${currFrame.functionName} (${currFrame.fileName}:${currFrame.lineNumber}:${currFrame.columnNumber})\n`;
                }
                else {
                    callstackData += `    at ${currFrame.fileName}:${currFrame.lineNumber}:${currFrame.columnNumber}\n`;
                }
            }

            return (
                <div>
                    {component}
                    <div>{callstackData}</div>
                </div>
            );
        }
        return component;
    }
}

function mapStateToProps(state: IStoreState): ILoggingProps {
    return {
        contextId: getSelectedContextId(state),
        filteredMessages: getVisibleLoggingMessages(state),
        totalMessageCount: getCountableMessageCount(state),
        filteredMessageCount: getCountableFilteredMessageCount(state)
    };
}

export default connect(mapStateToProps)(LoggingView);



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/logging/views/Logging.tsx