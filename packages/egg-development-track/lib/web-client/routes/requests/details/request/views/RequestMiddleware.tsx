import classNames from 'classnames';
import React from 'react';
import { connect } from 'react-redux';

import { trainCase } from 'common/util/StringUtilities';
import { getMiddleware, IFlattenedMiddleware, IFlattenedMiddlewareOperation } from '../RequestMiddlewareSelectors';
import { IResponseHeaderOperation, IResponseStatusCodeOperation, ResponseBodyOperationType, ResponseHeaderOperationType, ResponseStatusCodeOperationType } from 'modules/messages/schemas/IMiddlewareEndPayload';
import { IStoreState } from 'client/IStoreState';

import styles from './RequestMiddleware.scss';
import commonStyles from 'common/components/Common.scss';
import messageRowTargetStyles from 'common/components/MessageRowTarget.scss';
import Icon from 'common/components/Icon';
import StatusLabel from 'common/components/StatusLabel';
import StackFrame from 'common/components/StackFrame';

interface IMiddlewareViewProps {
    middleware: IFlattenedMiddleware[];
}

interface IMiddlewareModifiedItem {
    operationTypeText: string;
    nameText?: string;
    value: JSX.Element;
    wasOverwritten: boolean;
}

export class MiddlewareView extends React.Component<IMiddlewareViewProps, {}> {
    public render() {
        const middleware = this.props.middleware;

        let content = undefined;
        if (middleware.length === 0) {
            content = <tr><td colSpan={5} className={commonStyles.tableNoData}>No middleware detected</td></tr>;
        }
        else {
            content = middleware.map((middlewareRow, index) => this.renderRow(index + 1, middlewareRow));
        }

        return (
            <div className={styles.middleware}>
                <div className={styles.middlewareTitle}>
                    <h3 className={commonStyles.detailTitle}>Application middleware</h3>
                    <div className={styles.middlewareLegend}>
                        <div className={styles.middlewareLegendItem}>
                            { this.renderRequestResponseIcon(/* isRequest */ true) }
                            Request
                        </div>
                        <div className={styles.middlewareLegendItem}>
                            { this.renderRequestResponseIcon(/* isRequest */ false) }
                            Response
                        </div>
                    </div>
                </div>
                <table className={commonStyles.table}>
                    <thead>
                        <tr>
                            <th width="20" title="#">#</th>
                            <th width="20%" title="Name">Name</th>
                            <th width="15%" title="Package">Package</th>
                            <th width="20%"><span className={styles.middlewareModifiedHeader} title="Modified">Modified</span></th>
                            <th className={styles.middlewareValueHeader} title="Value">Value</th>
                            <th width="12%" title="Registered at">Registered at</th>
                        </tr>
                        <tr><td colSpan={6} className={commonStyles.tableHeadSpacer}></td></tr>
                    </thead>
                    <tbody className={styles.middlewareBody}>
                        {content}
                    </tbody>
                </table>
            </div>
        );
    }

    private renderRow(ordinal: number, middleware: IFlattenedMiddleware) {
        const modifiedItems = this.createModifiedItems(middleware.operations);

        return (
            <tr key={ordinal} id={middleware.id} className={messageRowTargetStyles.messageRowTargetContainer}>
                <td><span title={ordinal.toString()}>{ordinal}</span></td>
                <td>{this.renderName(middleware.name, middleware.depth)}</td>
                <td className={commonStyles.trimText}>{this.renderPackageName(middleware.packageName)}</td>
                <td className={commonStyles.trimText}>{this.renderModified(modifiedItems)}</td>
                <td className={commonStyles.trimText}>{this.renderValue(modifiedItems)}</td>
                <td><StackFrame frame={middleware.location} /></td>
            </tr>
        );
    }

    private renderPackageName(packageName: string) {
        if (packageName !== undefined && packageName.length) {
            return <span title={packageName}>{packageName}</span>;
        }
        else {
            return <span className={styles.middlewareNameAnonymous}>-</span>;
        }
    }

    private createModifiedItems(operations: IFlattenedMiddlewareOperation[]): IMiddlewareModifiedItem[]{
        const modifiedItems: IMiddlewareModifiedItem[] = [];

        operations.forEach(operation => {
            const createValueText = (o: IFlattenedMiddlewareOperation, value: string) => {
                // If no value text was provided, force whitespace to preserve row alignment...
                return value && value.length > 0
                    ? <span title={value} className={classNames({ [commonStyles.paramOverwritten]: !o.isCurrent})}>{value}</span>
                    : <span>&nbsp;</span>;
            };

            switch (operation.operation.type) {
                case ResponseBodyOperationType:
                    modifiedItems.push({
                        operationTypeText: 'Body',
                        value: createValueText(operation, undefined),
                        wasOverwritten: !operation.isCurrent
                    });

                    break;

                case ResponseHeaderOperationType:
                    const responseHeaderOperation = operation.operation as IResponseHeaderOperation;

                    responseHeaderOperation.values.forEach(value => {
                        modifiedItems.push({
                            operationTypeText: 'Header: ',
                            nameText: trainCase(responseHeaderOperation.name),
                            value: createValueText(operation, value),
                            wasOverwritten: !operation.isCurrent
                        });
                    });

                    break;

                case ResponseStatusCodeOperationType:
                    const responseStatusCodeOperation = operation.operation as IResponseStatusCodeOperation;

                    modifiedItems.push({
                        operationTypeText: 'Status Code',
                        value: (
                            <div className={styles.middlewareStatusCode}>
                                <StatusLabel statusCode={responseStatusCodeOperation.statusCode} />
                            </div>
                        ),
                        wasOverwritten: !operation.isCurrent
                    });

                    break;

                default:

                    break;
            }
        });

        return modifiedItems;
    }

    private renderName(name: string, depth: number) {
        const isAnonymous = name === undefined || name.length === 0 || name === '<anonymous>';
        const displayName = isAnonymous ? '[anonymous]' : name;

        return (
            <div className={commonStyles.trimText}>
                <span className={classNames({[styles.middlewareNameAnonymous]: isAnonymous})} title={displayName}>{displayName}</span>
            </div>
        );
    }

    private renderModified(modifiedItems: IMiddlewareModifiedItem[]) {
        if (modifiedItems.length) {
            return (
                <div className={styles.middlewareList}>
                    {
                        modifiedItems.map((item, index) => {
                            const annotationText = item.nameText
                                ? item.operationTypeText + item.nameText
                                : item.operationTypeText;

                            return (
                                <div key={index} className={styles.middlewareOperation} title={annotationText}>
                                    { this.renderRequestResponseIcon(/* isRequest: */ false) }
                                    <span className={commonStyles.trimText}><span className={styles.middlewareOperationType}>{item.operationTypeText}</span>{item.nameText ? <span>{item.nameText}</span> : <span />}</span>
                                </div>
                            );
                        })
                    }
                </div>
            );
        }
        else {
            return <span className={classNames(styles.middlewareModifiedHeader, styles.middlewareOperationType)}>-</span>;
        }
    }

    private renderRequestResponseIcon(isRequest: boolean) {
        const target = isRequest
            ? Icon.paths.Request
            : Icon.paths.Response;

        return <Icon className={isRequest ? styles.middlewareRequestIcon : styles.middlewareResponseIcon} target={target} />;
    }

    private renderValue(modifiedItems: IMiddlewareModifiedItem[]) {
        if (modifiedItems.length) {
            return (
                <div className={styles.middlewareList}>
                    {
                        modifiedItems.map((item, index) => {
                            return (
                                <div key={index} className={classNames(styles.middlewareOperation, { [commonStyles.paramOverwritten]: item.wasOverwritten})}>
                                    <span className={commonStyles.trimText}>{item.value}</span>
                                </div>
                            );
                        })
                    }
                </div>
            );
        }
        else {
            return <span className={styles.middlewareOperationType}>-</span>;
        }
    }
}

function mapStateToProps(state: IStoreState) {
    return {
        middleware: getMiddleware(state)
    };
}

export default connect(mapStateToProps)(MiddlewareView);



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/request/views/RequestMiddleware.tsx