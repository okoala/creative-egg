import React, { ReactNode } from 'react';
import { connect } from 'react-redux';
import Hammer from 'hammerjs';

import { SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH, SIDEBAR_THRESHOLD } from '../RequestsResizeConstants';
import { IRequestsResizeState } from '../RequestsResizeInterfaces';
import { IRequestFilterDetails } from '../RequestsFilterInterfaces';
import { IStoreState } from 'client/IStoreState';
import { getFollowMode } from '../RequestsSelector';
import { getFilteredRequests } from '../RequestsFilterSelectors';
import { setSidebarWidthAction, setOpenStateAction } from '../RequestsResizeActions';

import styles from './Requests.scss';
import RequestsSideBar from './RequestsSideBar';
import RequestsStatusBlock from '../components/RequestsStatusBlock';
import NotificationPanel from '../components/NotificationPanel';

// enable DOM events so `preventDefault()` could be called on events
Hammer.defaults.domEvents = true;

export interface IRequestsState {
    deltaX?: number;
}

export interface IRequestsProps {
    /**
     * The resize state of the request side bar.
     */
    resize: IRequestsResizeState;

    /**
     * Details of the current filter that is in place
     */
    requestFilterDetails: IRequestFilterDetails;

    /**
     * Id of the currently selected request
     */
    selectedRequestId: string;

    /**
     * Indicates if follow mode is enabled or not
     */
    followMode: boolean;

    /**
     * Child component that react router wants to render.
     */
    children?: ReactNode[];
}

export interface IRequestsCallbacks {
    saveSidebarWidth: (payload) => void;
    saveOpenState: (payload) => void;
}

const INITIAL_STATE: IRequestsState = {
    /**
     * difference between the start position
     * of the drag and the current pointer position
     */
    deltaX: 0
};

export class Requests extends React.Component<IRequestsProps & IRequestsCallbacks, IRequestsState> {
    /**
     * grip element
     */
    private grip: HTMLElement;

    /**
     * sidebar element
     */
    private sidebar: HTMLElement;

    /**
     * `hammerjs` manager on `grip`
     */
    private mc;

    /**
     * Constructor just to create `state` object.
     */
    constructor(props: IRequestsProps & IRequestsCallbacks, context) {
        super(props, context);
        this.state = INITIAL_STATE;
    }

    public render() {
        const {
            requestFilterDetails,
            selectedRequestId,
            followMode,
            children
        } = this.props;
        const width = this.clampWidth(this.getWidth(this.state.deltaX));

        return (
            <div className={styles.requests}>
                <div
                    className={styles.sidebarWithGrip}
                    style={{ width }}
                    ref={el => this.sidebar = el}>
                    <div className={styles.grip} ref={el => this.grip = el} />
                    <div className={styles.sidebar}>
                        <RequestsSideBar
                            requestFilterDetails={requestFilterDetails}
                            selectedRequestId={selectedRequestId}
                            followMode={followMode} />
                        <NotificationPanel />
                    </div>
                </div>
                <RequestsStatusBlock
                    className={styles.detail}
                    selectedRequestId={selectedRequestId}
                    isRequestsDataPresent={requestFilterDetails.filteredCount > 0}
                    notFoundText="No request is selected. Try selecting a request.">
                    { children }
                </RequestsStatusBlock>
            </div>
        );
    }

    /**
     * Function to `initialize` touch input listeners.
     */
    public componentDidMount(): void {
        this.mc = new Hammer.Manager(this.grip);
        this.mc.add(new Hammer.Pan);
        this.mc.on('pan', this.onPan);
        this.mc.on('panend', this.onPanEnd);
        this.mc.on('panstart', this.onPanStart);
    }

    /**
     * Function to handle `resize` event.
     * @param {Object} Event object.
     * @returns {void 0}
     */
    private onPan = (e): void => {
        e.preventDefault();
        this.setState({ deltaX: e.deltaX });
    }

    /**
     * Function to handle `resize start` event.
     * @param {Object} Event object.
     * @returns {void 0}
     */
    private onPanStart = (e): void => {
        /* ensure that width in the state is the same as
           actual width in the DOM - edge case for window resize */
        const style = window.getComputedStyle(this.sidebar);
        const sidebarWidth = parseInt(style.width, 10);

        if (sidebarWidth !== this.props.resize.sidebarWidth) {
            this.props.saveSidebarWidth({ sidebarWidth });
        }
    }

    /**
     * Function to handle `resize end` event.
     * @param {Object} Event object.
     * @returns {void 0}
     */
    private onPanEnd = (e): void => {
        const width = this.clampWidth(this.getWidth(this.state.deltaX));
        const isOpen = width > 0;
        const sidebarWidth = isOpen ? width : SIDEBAR_MIN_WIDTH;

        this.props.saveSidebarWidth({ sidebarWidth });
        if (isOpen !== this.props.resize.isOpen) {
            this.props.saveOpenState({ isOpen });
        }

        this.setState({ deltaX: 0 });
    }

    /**
     * Function to `remove` touch input listeners.
     */
    public componentWillUnmount(): void {
        this.mc.off('pan panstart panend');
    }

    /**
     * Function to get current sidebar `width` regarding delta.
     * @param {Number} Delta `x` of the user's `pan` input.
     * @returns {Number} Sidebar `width`.
     */
    private getWidth(deltaX: number): number {
        const {sidebarWidth, isOpen} = this.props.resize;
        const width = (isOpen ? sidebarWidth : 0) + deltaX;

        return (width >= SIDEBAR_THRESHOLD)
            // when < `SIDEBAR_MIN_WIDTH` but > `SIDEBAR_THRESHOLD`
            // => keep shrinking until `SIDEBAR_THRESHOLD` met
            ? Math.max(width, SIDEBAR_MIN_WIDTH)
            // if < `SIDEBAR_THRESHOLD` collapse the sidebar
            : 0;
    }

    /**
     * Function to ensure width is in [0...SIDEBAR_MAX_WIDTH] bounds.
     * @param {Number} Width to clamp.
     * @returns {Number} Clamped width.
     */
    private clampWidth(width: number): number {
        return Math.min(SIDEBAR_MAX_WIDTH, Math.max(width, 0));
    }
};

export interface IConnectedRequestsProps {
}

export function mapStateToProps(state: IStoreState): IRequestsProps {
    const { resize } = state.persisted.global.requests;
    const { selectedContextId } = state.session.messages;

    const requestFilterDetails = getFilteredRequests(state);
    const followMode = getFollowMode(state);

    return {
        requestFilterDetails,
        resize,
        selectedRequestId: selectedContextId,
        followMode
    };
};

export function mapDispatchToProps(dispatch): IRequestsCallbacks {
    return {
        saveSidebarWidth: (payload) => {
            dispatch(setSidebarWidthAction(payload));
        },
        saveOpenState: (payload) => {
            dispatch(setOpenStateAction(payload));
        }
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Requests) as React.ComponentClass<IConnectedRequestsProps>;



// WEBPACK FOOTER //
// ./src/client/routes/requests/views/Requests.tsx