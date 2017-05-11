import React from 'react';
import { connect } from 'react-redux';

import { getSelectedRequest } from '../RequestsDetailsSelector';
import detailsConfig from 'routes/requests/details/requests-details-config';
import { IStoreState } from 'client/IStoreState';

import styles from './RequestsDetails.scss';
import TabStrip, { TabStripType } from 'common/components/TabStrip';
import RequestsStatusBlock from 'routes/requests/components/RequestsStatusBlock';
import UrlText from 'common/components/UrlText';
import RequestsDetailsOverview from './RequestsDetailsOverview';

export interface IRequestsDetailsProps {
    children?;
    messagesCount: number;
    selectedRequestId: string;
    isRequestFound: boolean;
    url: string;
    protocol: string;
}

export class RequestsDetails extends React.Component<IRequestsDetailsProps, {}> {
    public render() {
        const { isRequestFound, messagesCount, selectedRequestId } = this.props;

        return (
            <RequestsStatusBlock
                className={styles.detailContainer}
                isRequestFound={isRequestFound}
                isRequestsDataPresent={messagesCount > 0}
                selectedRequestId={selectedRequestId}>
                    { this.renderDetails() }
            </RequestsStatusBlock>
        );
    }

    private renderDetails(): JSX.Element {
        const { url, protocol, selectedRequestId, children } = this.props;

        return (
            <div className={styles.detail}>
                <div className={styles.detailTitle}>
                    <UrlText url={url} protocol={protocol} />
                </div>
                <div className={styles.detailContent}>
                    <div className={styles.detailContentOverview}>
                        <RequestsDetailsOverview />
                    </div>
                    <div className={styles.detailContentDetail}>
                        <TabStrip className={styles.tabStrip}
                                  config={detailsConfig.getTabData()}
                                  urlData={{ requestId: selectedRequestId }}
                                  children={children}
                                  type={TabStripType.Plain} />
                    </div>
                </div>
            </div>
        );
    }
};

function mapStateToProps(state: IStoreState): IRequestsDetailsProps {
    // TODO: this needs to be cleaned up... this component shouldn't be accessing
    //       `state.messages` and I don't think it should know about `messagesCount`.
    //       if `RequestsStatusBlock` needs that, then this component should have
    //       a `isRequestsDataPresent` instead or something similar.
    const { messages } = state.session;

    let selectedRequest = getSelectedRequest(state);
    const isRequestFound = !!(selectedRequest && selectedRequest.webRequest);

    const props: IRequestsDetailsProps = {
        isRequestFound,
        messagesCount: messages.listing.length,
        selectedRequestId: messages.selectedContextId,
        url: isRequestFound ? selectedRequest.webRequest.url : undefined,
        protocol: isRequestFound ? selectedRequest.webRequest.protocol.identifier : undefined
    };

    return props;
}

export default connect(mapStateToProps)(RequestsDetails);



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/views/RequestsDetails.tsx