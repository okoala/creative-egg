import React from 'react';
import { connect } from 'react-redux';

import { IExchangeModel } from '../ServiceInterfaces';
import { IStoreState } from 'client/IStoreState';
import { getWebServiceExchanges, getStatusCodeFilteredWebServiceExchanges, getSelectedExchange } from '../ServiceSelectors';

import styles from './Service.scss';
import commonStyles from 'common/components/Common.scss';

import ServiceFilterBar from './ServiceFilterBar';
import ServiceTable from './ServiceTable';

interface IServiceProps {
    children;
    selectedExchange: IExchangeModel;
    displayedEventCount: number;
    totalEventCount: number;
}

export class Service extends React.Component<IServiceProps, {}> {
    public render() {
        return (
            <div className={styles.service}>
                {this.renderMaster()}
                {this.renderDetail()}
            </div>
        );
    }

    private renderMaster() {
        return (
            <div className={styles.serviceMaster}>
                <div className={commonStyles.tabViewHeader}>
                    <h3 className={commonStyles.detailTitle}>{this.getHeaderText()}</h3>
                    <div className={commonStyles.tabViewFilterHeader}>
                        <ServiceFilterBar />
                    </div>
                </div>
                <ServiceTable className={styles.serviceTable} />
                { this.renderNoEvents() }
            </div>
        );
    }

    private renderNoEvents() {
        const { displayedEventCount, totalEventCount } = this.props;

        if (totalEventCount === 0) {
            return <span className={styles.serviceMasterNoEvents}>No calls detected.</span>;
        }
        else if (displayedEventCount === 0) {
            return <span className={styles.serviceMasterNoEvents}>No calls shown. Try changing the filters above.</span>;
        }

        return undefined;
    }

    private renderDetail() {
        const { children, selectedExchange: exchange } = this.props;

        return exchange ? (
                <div className={styles.serviceDetail}>
                    {children && React.cloneElement(children, { exchange })}
                </div>
            ) : undefined;
    }

    private getHeaderText() {
        const { totalEventCount, displayedEventCount } = this.props;
        const events = totalEventCount === 1 ? 'call' : 'calls';
        if (totalEventCount === displayedEventCount) {
            return `${totalEventCount} ${events}`;
        }
        else {
            return `${displayedEventCount} of ${totalEventCount} ${events}`;
        }
    }
}

function mapStateToProps(state: IStoreState) {
    const allExchanges = getWebServiceExchanges(state);
    const exchanges = getStatusCodeFilteredWebServiceExchanges(state).exchanges;
    const selectedExchange = getSelectedExchange(state);

    return {
        selectedExchange,
        displayedEventCount: exchanges.length,
        totalEventCount: allExchanges.length
    };
}

export default connect(mapStateToProps)(Service);



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/service/views/Service.tsx