import React from 'react';
import ReactRouter from 'react-router';
import Hammer from 'hammerjs';
import { connect } from 'react-redux';

import styles from './ServiceDetails.scss';
import DetailBiPanel from 'common/components/DetailBiPanel';
import { requestConfig, responseConfig } from './ServiceTabStripConfig';
import { serviceTabName } from '../ServiceConfig';
import TabStrip, { TabStripType } from 'common/components/TabStrip';

import { IServiceResizePersistedState, IExchangeModel } from '../ServiceInterfaces';
import { IStoreState } from 'client/IStoreState';

import {
    SIDEBAR_CLOSE_HEIGHT,
    SIDEBAR_NORMAL_HEIGHT,
    SIDEBAR_THRESHOLD,
    SIDEBAR_MAX_HEIGHT
} from '../ServiceConstants';

import {
    setResizeOpenAction,
    setResizeHeightAction,
    toggleResizeOpenAction
} from '../ServiceActions';

// enable DOM events so `preventDefault()` could be called on events
Hammer.defaults.domEvents = true;

// TODO: detailAxis will probably go away... can probably derive it

export interface IServiceResizeCallbacks {
    toggleOpenState: () => void;
    saveSidebarHeight: (payload) => void;
    saveOpenState: (payload) => void;
}

interface IServiceDetailsViewProps extends ReactRouter.RouteComponentProps<{}, {}> {
    location;
    exchange: IExchangeModel;
    params: {
        requestId: string;
    };
    resize: IServiceResizePersistedState;
}

export interface IServiceDetailsViewState {
    deltaY?: number;
}

const initialState: IServiceDetailsViewState = {
    // difference between the start position
    // of the drag and the current pointer position
    deltaY: 0
};

export class ServiceDetails extends React.Component<IServiceDetailsViewProps & IServiceResizeCallbacks, IServiceDetailsViewState> {
    // grip element
    private grip: HTMLElement;
    // sidebar element
    private sidebar: HTMLElement;
    // `hammerjs` manager on `grip`
    private mc;

    /*  Constructor just to create `state` object. */
    constructor(props: IServiceDetailsViewProps & IServiceResizeCallbacks, context) {
        super(props, context);
        this.state = { ...initialState };
    }

    public render() {
        const {deltaY} = this.state;

        const height = this.getHeight(deltaY);

        return (
            <div
                style={{ height }}
                className={styles.details}
                ref={ this.saveSidebarRef }>

                <div
                    className={styles.grip}
                    ref={ this.saveGripRef } />

                <DetailBiPanel
                    onTitleClick={ this.props.toggleOpenState }
                    leftDetailPanel={this.renderLeftDetail()}
                    leftDetailPanelTitle="Request"
                    rightDetailPanel={this.renderRightDetail()}
                    rightDetailPanelTitle="Response" />
            </div>
        );
    }

    /**
     * Function to save reference to grip DOM element.
     * @param {Object} Html element.
     */
    private saveGripRef = (el): void => {
        this.grip = el;
    }

    /**
     * Function to save reference to main DOM element.
     * @param {Object} Html element.
     */
    private saveSidebarRef = (el): void => {
        this.sidebar = el;
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
        this.setState({ deltaY: e.deltaY });
    }

    /**
     * Function to handle `resize start` event.
     * @param {Object} Event object.
     * @returns {void 0}
     */
    private onPanStart = (e): void => {
        this.ensureHeightState();
    }

    /**
     * Function to ensure that height in the state is the same as
     * actual height in the DOM - edge case for window resize
     */
    private ensureHeightState(): void {
        const actualHeight = this.getActualElHeight();
        const isOpen = actualHeight > SIDEBAR_CLOSE_HEIGHT;
        // if panel is closed then flip the height to normal in case
        // if user will toggle the `isOpen` state
        const height = isOpen ? actualHeight : SIDEBAR_NORMAL_HEIGHT;

        if (height !== this.props.resize.height) {
            this.props.saveSidebarHeight({ height });
        }
    }

    /**
     * Function to ensure that `isOpen` in the state is updated.
     */
    private ensureOpenState(isOpen: boolean): void {
        if (isOpen !== this.props.resize.isOpen) {
            this.props.saveOpenState({ isOpen });
        }
    }

    /**
     * Function to get element's calculated height from the DOM.
     * @returns {number} Height of the element.
     */
    private getActualElHeight(): number {
        const style = window.getComputedStyle(this.sidebar);
        return parseInt(style.height, 10);
    }

    /**
     * Function to handle `resize end` event.
     * @param {Object} Event object.
     * @returns {void 0}
     */
    private onPanEnd = (e): void => {
        const clampedHeight = this.clampHeight(this.getHeight(e.deltaY));

        this.ensureHeightState();
        this.ensureOpenState( clampedHeight > SIDEBAR_THRESHOLD );
        this.setState({ ...initialState });
    }

    /* Function to `remove` touch input listeners. */
    public componentWillUnmount(): void {
        this.mc.off('pan panstart panend');
    }

    private renderLeftDetail() {
        return this.renderTabStrip(requestConfig, /* isRequest */ true);
    }

    private renderRightDetail() {
        return this.renderTabStrip(responseConfig, /* isRequest */ false);
    }

    private renderTabStrip(config, isRequest: boolean) {
        const { exchange, location, params } = this.props;

        const requestId = params.requestId;
        const detailAxis = `${serviceTabName}/${exchange.eventId}`;
        const requestAxis = location.query['requestAxis']; // tslint:disable-line:no-string-literal
        const responseAxis = location.query['responseAxis']; // tslint:disable-line:no-string-literal
        const component = config.byPath[isRequest ? requestAxis : responseAxis].component;

        return <TabStrip
                    config={config.list}
                    urlData={{ requestId, detailAxis, requestAxis, responseAxis }}
                    children={React.createElement(component)}
                    type={TabStripType.Tabs}
                    titlesContainerClassName={styles.detailTabTitles}
                    contentContainerClassName={styles.detailTabContent}
                />;
    }

    /* Function to get current sidebar `width` regarding delta.
       @param {Number} Delta `x` of the user's `pan` input.
       @returns {Number} Sidebar `width`.
    */
    private getHeight(deltaY: number = 0): number {
        const { height: stateHeight, isOpen } = this.props.resize;
        let height = ((isOpen) ? stateHeight : SIDEBAR_CLOSE_HEIGHT) - deltaY;

        return (height >= SIDEBAR_THRESHOLD)
                // when < `SIDEBAR_MIN_HEIGHT` but > `SIDEBAR_THRESHOLD`
                // => keep shrinking until `SIDEBAR_THRESHOLD` met
                ? Math.max(height, SIDEBAR_CLOSE_HEIGHT)
                // if < `SIDEBAR_THRESHOLD` collapse the sidebar
                : SIDEBAR_CLOSE_HEIGHT;
    }

    /* Function to ensure width is in [0...SIDEBAR_MAX_HEIGHT] bounds.
       @param {Number} Width to clamp.
       @returns {Number} Clamped width.
    */
    private clampHeight(height: number): number {
        return Math.min(SIDEBAR_MAX_HEIGHT, Math.max(height, SIDEBAR_CLOSE_HEIGHT));
    }
}

export function mapStateToProps(state: IStoreState, props) {
    const { resize } = state.persisted.global.requests.details.service;

    return { resize };
};

export function mapDispatchToProps(dispatch): IServiceResizeCallbacks {
    return {
        toggleOpenState: () => {
            dispatch(toggleResizeOpenAction());
        },
        saveSidebarHeight: (payload) => {
            dispatch(setResizeHeightAction(payload));
        },
        saveOpenState: (payload) => {
            dispatch(setResizeOpenAction(payload));
        }
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(ServiceDetails);



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/service/views/ServiceDetails.tsx