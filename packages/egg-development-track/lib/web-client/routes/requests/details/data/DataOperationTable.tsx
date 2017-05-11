import React from 'react';
import classNames from 'classnames';

import commonStyles from 'common/components/Common.scss';
import TimeDuration from 'common/components/TimeDuration';

export interface IDataOperationTableOperationState {
    command: string;
    database: string;
    duration: number;
    id: string;
    operation: string;
    recordCount: number | string;
    databaseName: string;
    serverName: string;
}

export interface IDataOperationTableOperation {
    ordinal: number;
    operation: IDataOperationTableOperationState;
}

export interface IDataOperationTableProps {
    operations: IDataOperationTableOperation[];
    selectedContextId: string;
    selectedOperationId: string;
}

export interface IDataOperationTableCallbacks {
    onSelected: (contextId: string, operationId: string) => void;
}

interface IDataOperationTableCombinedProps
    extends IDataOperationTableProps, IDataOperationTableCallbacks {
}

export class DataOperationTable extends React.Component<IDataOperationTableCombinedProps, {}> {
    public render() {
        const operations = this.props.operations;

        let content = undefined;
        if (operations.length === 0) {
            content = <tr><td colSpan={6} className={commonStyles.tableNoData}>No operations detected</td></tr>;
        }
        else {
            content = operations.map((operation, index) => this.renderRow(operation, index));
        }

        return (
            <table className={commonStyles.table}>
                <thead>
                    <tr>
                        <th width="60">Ordinal</th>
                        <th width="15%">Database</th>
                        <th>Command</th>
                        <th width="70">Duration</th>
                        <th width="60">Operation</th>
                        <th width="55">Records</th>
                    </tr>
                    <tr><td colSpan={6} className={commonStyles.tableHeadSpacer}></td></tr>
                </thead>
                <tbody>
                    {content}
                </tbody>
            </table>
        );
    }

    public renderRow(operation: IDataOperationTableOperation, index: number) {
        return (
            <tr role="button" tabIndex={index} className={classNames(commonStyles.tableSelectableRow, { [commonStyles.tableSelectedRow]: operation.operation.id === this.props.selectedOperationId })} key={operation.operation.id} onKeyDown={e => this.selectOperation(operation.operation.id)} onClick={e => this.selectOperation(operation.operation.id)}>
                <td>{operation.ordinal}</td>
                <td className={commonStyles.trimText}>{operation.operation.database}</td>
                <td className={commonStyles.trimText}>{operation.operation.command}</td>
                <td className={commonStyles.trimText}><TimeDuration duration={operation.operation.duration} /></td>
                <td className={commonStyles.trimText}>{operation.operation.operation}</td>
                <td>{DataOperationTable.getRecordCountText(operation.operation.recordCount)}</td>
            </tr>
        );
    }

    private selectOperation(operationId: string) {
        const { selectedContextId, onSelected} = this.props;

        onSelected(selectedContextId, operationId);
    }

    private static getRecordCountText(recordCount: number | string) {
        return recordCount ? recordCount : '-';
    }
}



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/data/DataOperationTable.tsx