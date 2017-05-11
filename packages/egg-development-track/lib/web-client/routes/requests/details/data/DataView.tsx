import React from 'react';
import { connect } from 'react-redux';

import { getSelectedOperationIdSelector, getTotalOperationCountSelector } from './DataSelectors';
import { IStoreState } from 'client/IStoreState';

import styles from './DataView.scss';
import commonStyles from 'common/components/Common.scss';
import { DataFilterBarContainer } from './DataFilterBarContainer';
import { DataOperationTableContainer } from './DataOperationTableContainer';

interface IDataViewProps {
    children?;
    selectedOperationId: string;
    totalOperationCount: number;
}

export class DataView extends React.Component<IDataViewProps, {}> {
    public render() {
        return (
            <div className={styles.view}>
                {this.renderMaster()}
                {this.renderDetail()}
            </div>
        );
    }

    private renderMaster() {
        return (
            <div className={styles.master}>
                <h3 className={commonStyles.detailTitle}>{this.getHeaderText()}</h3>
                <DataFilterBarContainer />
                <DataOperationTableContainer />
            </div>
        );
    }

    private renderDetail() {
        const { children, selectedOperationId } = this.props;

        return selectedOperationId ? (
            <div className={styles.detail}>
                {children && React.cloneElement(children, {})}
            </div>
        ) : undefined;
    }

    private getHeaderText() {
        const { totalOperationCount } = this.props;
        return totalOperationCount + (totalOperationCount === 1 ? ' operation' : ' operations');
    }
}

function mapStateToProps(state: IStoreState): IDataViewProps {
    return {
        selectedOperationId: getSelectedOperationIdSelector(state),
        totalOperationCount: getTotalOperationCountSelector(state)
    };
}

export default connect(mapStateToProps)(DataView);



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/data/DataView.tsx