import { connect } from 'react-redux';

import RequestResourceTable, { IRequestResourceTableProps } from './RequestResourceTable';
import { getBrowserResourceTypeCounts } from '../RequestResourceSelectors';
import { IStoreState } from 'client/IStoreState';

function mapStateToProps(state: IStoreState): IRequestResourceTableProps {
    return {
        values: getBrowserResourceTypeCounts(state),
        valueHeader: 'Count',
        labelHeader: 'Resource',
        fixedPoints: 0
    };
}

const RequestResourceCountTable = connect(mapStateToProps)(RequestResourceTable); // tslint:disable-line:variable-name

export default RequestResourceCountTable;



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/request/views/RequestResourceCountTable.tsx