import React from 'react';

import styles from './DataDetailsView.scss';
import DetailBiPanel from 'common/components/DetailBiPanel';
import { DataOperationCommandContainer } from './DataOperationCommandContainer';
import DataOperationSummaryContainer from './DataOperationSummaryContainer';

export interface IDataDetailsViewProps {
    children?;
    location?;
}

export class DataDetailsView extends React.Component<IDataDetailsViewProps, {}> {
    public render() {
        return (
            <div className={styles.view}>
                <DetailBiPanel leftDetailPanel={this.renderLeftDetail()} leftDetailPanelTitle="Command" rightDetailPanel={this.renderRightDetail()} rightDetailPanelTitle="Summary" />
            </div>
        );
    }

    private renderLeftDetail() {
        return <DataOperationCommandContainer />;
    }

    private renderRightDetail() {
        const { location } = this.props;

        return <DataOperationSummaryContainer summaryAxis={location.query.summaryAxis} />;
    }
}

export default DataDetailsView;



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/data/DataDetailsView.tsx