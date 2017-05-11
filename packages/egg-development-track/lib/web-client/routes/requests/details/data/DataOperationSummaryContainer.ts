import React from 'react';
import { connect } from 'react-redux';

import { DataOperationSummary, IDataOperationSummaryProps } from './DataOperationSummary';
import { getSelectedContextId } from 'routes/requests/RequestsSelector';
import { getSelectedOperationIdSelector } from './DataSelectors';
import { IStoreState } from 'client/IStoreState';

interface IConnectedDataOperationSummaryContainerProps {
    summaryAxis: string;
}

function mapStateToProps(state: IStoreState): IDataOperationSummaryProps {
    return {
        requestId: getSelectedContextId(state),
        operationId: getSelectedOperationIdSelector(state)
    };
}

export default connect(mapStateToProps)(DataOperationSummary) as React.ComponentClass<IConnectedDataOperationSummaryContainerProps>;



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/data/DataOperationSummaryContainer.ts