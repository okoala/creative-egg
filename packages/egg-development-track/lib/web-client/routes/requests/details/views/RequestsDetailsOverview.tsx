import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import Modal from 'react-modal';
import { push } from 'react-router-redux';

import { getTime, getDate } from 'common/util/DateTimeUtilities';
import { getSingleMessageByType } from 'routes/requests/RequestsSelector';
import { getBrowserNavigationTimingOffsets, BrowserNavigationTimingSegments } from 'routes/requests/RequestsOverviewSelector';
import { getSelectedRequest, calculateDuration } from '../RequestsDetailsSelector';
import { IBrowserNavigationTimingPayload, BrowserNavigationTimingType } from 'modules/messages/schemas/IBrowserNavigationTimingPayload';
import { IStoreState } from 'client/IStoreState';
import { IWebResponsePayload } from 'client/modules/messages/schemas/IWebResponsePayload';
import { getValueAtKeyCaseInsensitive } from 'common/util/ObjectUtilities';

import styles from './RequestsDetailsOverview.scss';
import commonStyles from 'common/components/Common.scss';
import { StatusLabel } from 'common/components/StatusLabel';
import { ClientLabel } from 'common/components/ClientLabel';
import TimeDuration from 'common/components/TimeDuration';
import Icon from 'common/components/Icon';
import { selectOffsetsAction } from 'routes/requests/details/timeline/TimelineActions';
import { getSelectedThemeName } from 'shell/themes/ThemesSelectors';

interface IOverviewLine {
    title: string;
    type: 'timing' | 'clientLabel' | 'queryCount' | 'statusLabel' | 'statusMessage' | 'span';
    infoTitle?: string;
    actionTitle?: string;
    value?: number | string;
    offsets?: {
        start: number;
        end: number;
    };
    meta?: object;
    subDetails?: IOverviewLine[];
}

const detailRenderMap = {
    timing: detail => detail.value === false
        ? <span className={commonStyles.trimText} title="No data - This request was not rendered on a client">
            No data
        </span>
        : <TimeDuration duration={detail.value} />,
    clientLabel: detail => <ClientLabel userAgent={detail.value} />,
    queryCount: detail => <span>
        <TimeDuration duration={detail.value} /> / <span>{detail.meta.length}</span>
    </span>,
    statusLabel: detail => <StatusLabel statusCode={detail.meta.statusCode} statusMessage={detail.meta.statusMessage} />,
    span: detail => <span title={(detail.meta && detail.meta.title) || detail.value}>
        {detail.value}
    </span>
};

export interface IRequestsDetailsOverviewProps {
    details: IOverviewLine[];
    requestId: string;
    theme: string;
}

interface IRequestsDetailsOverviewState {
    modalIsOpen: boolean;
    expanded: boolean;
}

interface IRequestDetailsOverviewCallbacks {
    onSelectedOffsetsChanged: (requestId: string, minOffset?: number, maxOffset?: number, segment?: string) => void;
}

export class RequestsDetailsOverview extends React.Component<IRequestsDetailsOverviewProps & IRequestDetailsOverviewCallbacks, IRequestsDetailsOverviewState> {
    constructor() {
        super();

        this.state = {
            modalIsOpen: false,
            expanded: true
        };
    }
    private openModal = () => { this.setState({ modalIsOpen: true }); }
    private closeModal = () => { this.setState({ modalIsOpen: false }); }
    private toggleSubDetails = () => { this.setState({ expanded: !this.state.expanded }); }
    private renderModal() {
        const { theme } = this.props;
        const { modalIsOpen } = this.state;

        return (
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={this.closeModal}
                className={commonStyles.modal}
                overlayClassName={classNames(theme, commonStyles.modalOverlay)}
                contentLabel="Import Messages">
                <div className={commonStyles.modalInner}>
                    <button onClick={this.closeModal} className={commonStyles.modalClose}>
                        <Icon target={Icon.paths.Close} className={commonStyles.modalCloseIcon} />
                    </button>
                    <h3 className={commonStyles.modalTitle}>Page load time</h3>
                    <p>Glimpse groups <a className={commonStyles.link} href="https://www.w3.org/TR/navigation-timing/#processing-model">standard timing attributes defined by W3C</a> as follows:</p>
                    <img
                        src={require('assets/images/requests/overview.svg')}
                        alt="Page load time"
                        style={{width: '100%'}}/>
                </div>
            </Modal>
        );
    }
    private renderValue(detail) {
        if (!detail) {
            return null; // tslint:disable-line:no-null-keyword
        }

        const renderer = detailRenderMap[detail.type];

        return renderer(detail);
    }
    private renderDetails(details) {
        const { onSelectedOffsetsChanged, requestId } = this.props;
        const { expanded } = this.state;

        if (!details) {
            return null; // tslint:disable-line:no-null-keyword
        }

        return details.map((detail, i) => {
            if (!detail) {
                return null; // tslint:disable-line:no-null-keyword
            }

            return (
                <div className={styles.overviewDetailItem} key={i}>
                    <div className={classNames(commonStyles.trimText, styles.overviewDetailTitle)}>
                        {detail.infoTitle &&
                            <div className={styles.overviewInfoIcon} title={detail.infoTitle}>
                                <Icon
                                    pathClassName={styles.overviewDetailIconPath}
                                    target={Icon.paths.Information}
                                    onClick={this.openModal}/>
                            </div>
                        }
                        <span title={detail.title} className={styles.overviewDetailTitleText}>{detail.title}</span>
                        {detail.offsets &&
                            <div className={styles.overviewDetailIcon} title={detail.actionTitle}>
                                <Icon
                                    pathClassName={styles.overviewDetailIconPath}
                                    target={Icon.paths.Chart}
                                    onClick={() => onSelectedOffsetsChanged(requestId, detail.offsets.start, detail.offsets.end, detail.meta.segment)}/>
                            </div>
                        }
                        {detail.subDetails &&
                            <Icon
                                className={styles.overviewChevronUpIcon}
                                pathClassName={styles.overviewChevronIconPath}
                                target={expanded ? Icon.paths.ChevronUp : Icon.paths.ChevronDown}
                                onClick={this.toggleSubDetails}/>
                        }
                    </div>
                    <div className={commonStyles.trimText}>
                        {this.renderValue(detail)}
                    </div>
                    {detail.subDetails && detail.subDetails.length && expanded &&
                        <div className={styles.overviewSubDetail}>
                            {this.renderDetails(detail.subDetails)}
                        </div>
                    }
                </div>
            );
        });
    }
    public render() {
        const { details } = this.props;

        return (
            <div className={styles.overview}>
                <div className={classNames(commonStyles.trimText, styles.overviewTitle)}>
                    Overview
                </div>
                <div className={styles.overviewDetailContainer}>
                    <div className={styles.overviewDetail}>
                        {this.renderDetails(details)}
                    </div>
                </div>
                {this.renderModal()}
            </div>
        );
    }
};

function getPageLoadOverviewLine(duration: number, webResponse: IWebResponsePayload, browserNavigationTimingPayload?: IBrowserNavigationTimingPayload): IOverviewLine {
    if (!browserNavigationTimingPayload) {
        return {
            title: 'Load time',
            type: 'timing',
            value: duration,
            infoTitle: 'Click to see page load time definition',
            subDetails: [
                {
                    title: 'Network connection',
                    type: 'span',
                    value: '--'
                },
                {
                    title: 'Sending request',
                    type: 'span',
                    value: '--'
                },
                {
                    title: 'Receiving response',
                    type: 'span',
                    value: '--'
                },
                {
                    title: 'Browser processing',
                    type: 'span',
                    value: '--'
                }
            ]
        };
    }

    const { PageLoad, NetworkConnection, SendingRequest, ReceivingResponse, BrowserProcessing } = BrowserNavigationTimingSegments; // tslint:disable-line:variable-name

    const {
        [PageLoad]: PageLoadTiming, // tslint:disable-line:variable-name
        [NetworkConnection]: NetworkConnectionTiming, // tslint:disable-line:variable-name
        [SendingRequest]: SendingRequestTiming, // tslint:disable-line:variable-name
        [ReceivingResponse]: ReceivingResponseTiming, // tslint:disable-line:variable-name
        [BrowserProcessing]: BrowserProcessingTiming // tslint:disable-line:variable-name
    } = getBrowserNavigationTimingOffsets(browserNavigationTimingPayload);

    return {
        title: 'Load time',
        infoTitle: 'Click to see page load time definition',
        actionTitle: 'Show page load time on timeline',
        type: 'timing',
        value: duration,
        offsets: PageLoadTiming.offsets,
        meta: { segment: BrowserNavigationTimingSegments.PageLoad },
        subDetails: [
            {
                title: 'Network connection',
                actionTitle: 'Show network connection time on timeline',
                type: 'timing',
                value: NetworkConnectionTiming.duration,
                offsets: NetworkConnectionTiming.offsets,
                meta: { segment: BrowserNavigationTimingSegments.NetworkConnection }
            },
            {
                title: 'Sending request',
                actionTitle: 'Show sending request time on timeline',
                type: 'timing',
                value: SendingRequestTiming.duration,
                offsets: SendingRequestTiming.offsets,
                meta: { segment: BrowserNavigationTimingSegments.SendingRequest }
            },
            {
                title: 'Receiving response',
                actionTitle: 'Show receiving response time on timeline',
                type: 'timing',
                value: ReceivingResponseTiming.duration,
                offsets: ReceivingResponseTiming.offsets,
                meta: { segment: BrowserNavigationTimingSegments.ReceivingResponse }
            },
            {
                title: 'Browser processing',
                actionTitle: 'Show browser processing time on timeline',
                type: 'timing',
                value: BrowserProcessingTiming.duration,
                offsets: BrowserProcessingTiming.offsets,
                meta: { segment: BrowserNavigationTimingSegments.BrowserProcessing }
            }
        ]
    };
}

function mapStateToProps(state: IStoreState) {
    const { webRequest, webResponse, context, id } = getSelectedRequest(state);
    const browserNavigationTimingMessage = getSingleMessageByType<IBrowserNavigationTimingPayload>(context.byType, BrowserNavigationTimingType);
    const browserNavigationTiming = browserNavigationTimingMessage && browserNavigationTimingMessage.payload;

    const duration = calculateDuration(webResponse, browserNavigationTiming);

    const details: IOverviewLine[] = [
        getPageLoadOverviewLine(duration, webResponse, browserNavigationTiming),
        webRequest && {
            title: 'Client',
            type: 'clientLabel',
            value: getValueAtKeyCaseInsensitive(webRequest.headers, 'User-Agent')
        },
        webResponse && {
            title: 'Method',
            type: 'span',
            value: webRequest.method
        },
        webResponse && {
            title: 'Status',
            type: 'statusLabel',
            meta: {
                statusMessage: webResponse.statusMessage,
                statusCode: webResponse.statusCode
            }
        },
        webRequest && {
            title: 'Date',
            type: 'span',
            value: getDate(webRequest.startTime)
        },
        webRequest && {
            title: 'Time',
            type: 'span',
            value: getTime(webRequest.startTime)
        }
    ];

    return {
        details,
        requestId: id,
        theme: getSelectedThemeName(state)
    };
}

function mapDispatchToProps(dispatch): IRequestDetailsOverviewCallbacks {
    return {
        onSelectedOffsetsChanged: (requestId: string, minOffset?: number, maxOffset?: number, segment?: string) => {
            dispatch(push(`/requests/${requestId}/timeline`));
            dispatch(selectOffsetsAction({
                requestId,
                minOffset,
                maxOffset,
                segment
            }));
        }
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(RequestsDetailsOverview);



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/views/RequestsDetailsOverview.tsx