import React from 'react';
import classNames from 'classnames';

import styles from './DetailBiPanel.scss';

export interface IDetailBiPanelProps {
    leftDetailPanel;
    leftDetailPanelTitle: string;
    rightDetailPanel;
    rightDetailPanelTitle: string;
}

export interface IDetailBiPanelCallbacks {
    onTitleClick?: () => void;
}

class DetailBiPanel extends React.Component<IDetailBiPanelProps & IDetailBiPanelCallbacks, {}> {
    public render() {
        const {
            onTitleClick,
            leftDetailPanelTitle,
            leftDetailPanel,
            rightDetailPanelTitle,
            rightDetailPanel
        } = this.props;

        const className = classNames(styles.detail, {
            [styles.isClickableTitles]: !!onTitleClick
        });

        return (
            <div className={className}>
                <div className={styles.detailPanel}>
                    <div
                        className={styles.detailPanelTitle}
                        onClick={onTitleClick}>
                            {leftDetailPanelTitle}
                    </div>
                    <div className={styles.detailPanelContent}>{leftDetailPanel}</div>
                </div>
                <div className={styles.detailMargin} />
                <div className={styles.detailPanel}>
                    <div
                        className={styles.detailPanelTitle}
                        onClick={onTitleClick}>
                            {rightDetailPanelTitle}
                    </div>
                    <div className={styles.detailPanelContent}>{rightDetailPanel}</div>
                </div>
            </div>
        );
    }
}

export default DetailBiPanel;



// WEBPACK FOOTER //
// ./src/client/common/components/DetailBiPanel.tsx