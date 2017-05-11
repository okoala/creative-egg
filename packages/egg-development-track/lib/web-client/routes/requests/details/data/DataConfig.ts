import { selectOperationAction, tabSelectedAction } from './DataActions';
import DataView from './DataView';
import { DataDetailsView } from './DataDetailsView';
import { IStoreState } from 'client/IStoreState';

const path = 'data';

function normalizePath(store, nextState, replace) {
    let { summaryAxis: nextSummaryAxis } = nextState.location.query;

    const state: IStoreState = store.getState();
    const currentSummaryAxis = state.persisted.global.requests.details.data.selectedTab;

    if (!nextSummaryAxis) {
        const requestId = nextState.params.requestId;
        const operationId = nextState.params.operationId;

        nextSummaryAxis = currentSummaryAxis;

        replace({
            pathname: `/requests/${requestId}/${path}/${operationId}`,
            query: {
                summaryAxis: nextSummaryAxis
            }
        });
    }

    return {
        currentSummaryAxis,
        nextSummaryAxis
    };
}

export default {
    getTabData() {
        return {
            title: 'Data',
            getUrl: data => `/requests/${data.requestId}/${path}`
        };
    },
    getRoute(store) {
        return {
            path: path,
            component: DataView,
            childRoutes: [
                {
                    path: ':operationId',
                    components: DataDetailsView,
                    onEnter: (nextState) => {
                        const requestId = nextState.params.requestId;
                        const operationId = nextState.params.operationId;

                        store.dispatch(selectOperationAction({ requestId, operationId }));
                    },
                    onChange: (prevState, nextState, replace) => {
                        const { currentSummaryAxis, nextSummaryAxis } = normalizePath(store, nextState, replace);

                        if (nextSummaryAxis !== currentSummaryAxis) {
                            store.dispatch(tabSelectedAction(nextSummaryAxis));
                        }
                    },
                    indexRoute: {
                        onEnter: (nextState, replace) => {
                            normalizePath(store, nextState, replace);
                        }
                    }
                }
            ]
        };
    }
};



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/data/DataConfig.ts