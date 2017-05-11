import { getSelectedOperationSelector } from './DataSelectors';
import { IStoreState } from 'client/IStoreState';
import { RequestDetailPanelDataOperationCommandView, IRequestDetailPanelDataOperationCommandViewProps } from './DataOperationCommandView';

import { connect } from 'react-redux';

function getLanguageForDatabase(database: string): string {
    switch (database) {
        case 'MongoDB':
            return 'json';
        default:
            return 'sql';
    }
}

function mapStateToProps(state: IStoreState, ownProps): IRequestDetailPanelDataOperationCommandViewProps {
    const operation = getSelectedOperationSelector(state);

    return {
        command: operation ? operation.operation.command : '',
        language: getLanguageForDatabase(operation ? operation.operation.database : undefined)
    };
}

/* tslint:disable-next-line:variable-name */
export const DataOperationCommandContainer = connect(mapStateToProps)(RequestDetailPanelDataOperationCommandView);



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/data/DataOperationCommandContainer.ts