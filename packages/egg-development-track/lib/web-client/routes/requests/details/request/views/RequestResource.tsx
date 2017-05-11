import React from 'react';

import styles from './RequestResource.scss';
import commonStyles from 'common/components/Common.scss';

import RequestResourceCountTable from './RequestResourceCountTable';
import RequestResourceDurationTable from './RequestResourceDurationTable';
import RequestResourceSizeTable from './RequestResourceSizeTable';

export default class RequestResourceView extends React.Component<{}, {}> {
    public render() {
        return (
            <div>
                <h3 className={commonStyles.detailTitle}>Resources</h3>
                <div className={styles.requestResource}>
                    <div className={styles.requestResourceTableContainer}>
                        <RequestResourceCountTable />
                    </div>
                    <div className={styles.requestResourceTableContainer}>
                        <RequestResourceDurationTable />
                    </div>
                    <div className={styles.requestResourceTableContainer}>
                        <RequestResourceSizeTable />
                    </div>
                </div>
            </div>
        );
    }
}



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/request/views/RequestResource.tsx