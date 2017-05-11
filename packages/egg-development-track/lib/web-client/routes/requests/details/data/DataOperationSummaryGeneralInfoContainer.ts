import { connect } from 'react-redux';

import { getSelectedOperationSelector } from './DataSelectors';
import { DataOperationSummaryGeneralInfo, IDataOperationSummaryGeneralInfoProps } from './DataOperationSummaryGeneralInfo';
import { IStoreState } from 'client/IStoreState';

function mapStateToProps(state: IStoreState): IDataOperationSummaryGeneralInfoProps {
    const operation = getSelectedOperationSelector(state);

    return {
        databaseType: operation ? operation.operation.database : '',
        databaseName: operation ? operation.operation.databaseName : '',
        serverName: operation ? operation.operation.serverName : ''
    };
}

/* tslint:disable-next-line:variable-name */
export const DataOperationSummaryGeneralInfoContainer = connect(mapStateToProps)(DataOperationSummaryGeneralInfo);



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/data/DataOperationSummaryGeneralInfoContainer.ts