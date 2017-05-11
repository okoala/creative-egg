import { connect } from 'react-redux';

import RequestResourceTable, { IRequestResourceTableProps } from './RequestResourceTable';
import { getBrowserResourceTypeDurations } from '../RequestResourceSelectors';
import { IStoreState } from 'client/IStoreState';

function mapStateToProps(state: IStoreState): IRequestResourceTableProps {
    return {
        values: getBrowserResourceTypeDurations(state),
        valueHeader: 'Millisecond',
        labelHeader: 'Resource',
        fixedPoints: 2
    };
}

const RequestResourceDurationTable = connect(mapStateToProps)(RequestResourceTable); // tslint:disable-line:variable-name

export default RequestResourceDurationTable;



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/request/views/RequestResourceDurationTable.tsx