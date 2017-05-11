import React from 'react';

import styles from './DataOperationSummary.scss';
import tabStripConfig from './DataOperationSummaryTabStripConfig';
import TabStrip, { TabStripType } from 'common/components/TabStrip';

export interface IDataOperationSummaryProps {
    requestId?: string;
    operationId?: string;
    summaryAxis?: string;
}

export class DataOperationSummary extends React.Component<IDataOperationSummaryProps, {}>{
    public render() {
        const { requestId, operationId, summaryAxis } = this.props;
        const summaryComponent = tabStripConfig.getOperationRouteMap()[summaryAxis].component;

        return (
            <TabStrip config={tabStripConfig.getOperationRouteData()} urlData={{ requestId, operationId }} type={TabStripType.Tabs} titlesContainerClassName={styles.summaryTabTitles} contentContainerClassName={styles.summaryTabContent}>
                { React.createElement(summaryComponent) }
            </TabStrip>
        );
    }
}

export default DataOperationSummary;



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/data/DataOperationSummary.tsx