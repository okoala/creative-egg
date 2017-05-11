import { DataOperationTable, IDataOperationTableProps, IDataOperationTableCallbacks } from './DataOperationTable';
import { getFilteredOperationsSelector, getSelectedOperationIdSelector } from './DataSelectors';
import { getSelectedContextId } from 'routes/requests/RequestsSelector';
import { IStoreState } from 'client/IStoreState';

import { connect } from 'react-redux';
import { push } from 'react-router-redux';

function mapStateToProps(state: IStoreState): IDataOperationTableProps {
    return {
        // TODO: How should selection behave as filters are added/removed?
        operations: getFilteredOperationsSelector(state),
        selectedContextId: getSelectedContextId(state),
        selectedOperationId: getSelectedOperationIdSelector(state)
    };
}

function mapDispatchToProps(dispatch): IDataOperationTableCallbacks {
    return {
        onSelected: (requestId: string, operationId: string) => {
            dispatch(push(`/requests/${requestId}/data/${operationId}`));
        }
    };
}

/* tslint:disable-next-line:variable-name */
export const DataOperationTableContainer = connect(mapStateToProps, mapDispatchToProps)(DataOperationTable);



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/data/DataOperationTableContainer.ts