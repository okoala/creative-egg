import React from 'react';

import commonStyles from 'common/components/Common.scss';
import styles from './DataOperationSummaryGeneralInfo.scss';

export interface IDataOperationSummaryGeneralInfoProps {
    databaseType: string;
    databaseName: string;
    serverName: string;
}

export class DataOperationSummaryGeneralInfo extends React.Component<IDataOperationSummaryGeneralInfoProps, {}> {
    public render() {
        return (
            <div className={styles.generalInfo}>
                <ul>
                    <li><span className={commonStyles.paramName}>Database: </span><span className={commonStyles.paramValue}>{this.props.databaseType}</span></li>
                    <li><span className={commonStyles.paramName}>Database Name: </span><span className={commonStyles.paramValue}>{this.props.databaseName || '-'}</span></li>
                    <li><span className={commonStyles.paramName}>Server: </span><span className={commonStyles.paramValue}>{this.props.serverName || '-'}</span></li>
                </ul>
            </div>
        );
    }
}

export default DataOperationSummaryGeneralInfo;



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/data/DataOperationSummaryGeneralInfo.tsx