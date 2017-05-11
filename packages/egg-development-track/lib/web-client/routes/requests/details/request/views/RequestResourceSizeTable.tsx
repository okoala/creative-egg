import { connect } from 'react-redux';

import RequestResourceTable, { IRequestResourceTableProps } from './RequestResourceTable';
import { getBrowserResourceTypeSizes } from '../RequestResourceSelectors';
import { IStoreState } from 'client/IStoreState';

function mapStateToProps(state: IStoreState): IRequestResourceTableProps {
    return {
        values: getBrowserResourceTypeSizes(state),
        valueHeader: 'Bytes',
        labelHeader: 'Resource',
        fixedPoints: 0
    };
}

const RequestResourceSizeTable = connect(mapStateToProps)(RequestResourceTable); // tslint:disable-line:variable-name

export default RequestResourceSizeTable;



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/request/views/RequestResourceSizeTable.tsx