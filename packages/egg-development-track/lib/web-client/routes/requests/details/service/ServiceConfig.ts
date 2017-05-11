import Service from './views/Service';
import ServiceDetails from './views/ServiceDetails';

import { getSelectedExchangeId } from './ServiceSelectors';
import { selectExchangeAction } from './ServiceActions';
import { tabSelected } from '../components/request-response-tab-strip/RequestResponseTabStripActions';
import { normalizePath } from '../components/request-response-tab-strip/RequestResponseTabStripConfig';

export const serviceTabName = 'service';

export function getSelectedExchangePath(requestId: string, exchangeId: string) {
    return `/requests/${requestId}/${serviceTabName}/${exchangeId}`;
}

function getNormalizedPath(params) {
    const { requestId, exchangeId } = params;

    return getSelectedExchangePath(requestId, exchangeId);
}

export default {
    getTabData() {
        return {
            title: 'Web Services',
            getUrl: data => `/requests/${data.requestId}/${serviceTabName}`
        };
    },
    getRoute(store) {
        return {
            path: serviceTabName,
            component: Service,
            indexRoute: {
                onEnter: (nextState, replace) => {
                    const exchangeId = getSelectedExchangeId(store.getState());

                    if (exchangeId) {
                        replace(getSelectedExchangePath(nextState.params.requestId, exchangeId));
                    }
                }
            },
            childRoutes: [
                {
                    path: ':exchangeId',
                    onEnter: (nextState) => {
                        const requestId = nextState.params.requestId;
                        const exchangeId = nextState.params.exchangeId;

                        store.dispatch(selectExchangeAction({ requestId, exchangeId }));
                    },
                    onChange: (prevState, nextState, replace) => {
                        const { currentRequestAxis, currentResponseAxis, nextRequestAxis, nextResponseAxis } = normalizePath(store, serviceTabName, nextState, replace, getNormalizedPath);

                        if (nextRequestAxis !== currentRequestAxis || nextResponseAxis !== currentResponseAxis) {
                            store.dispatch(tabSelected(serviceTabName, nextRequestAxis, nextResponseAxis));
                        }
                    },
                    components: ServiceDetails,
                    indexRoute: {
                        onEnter: (nextState, replace) => {
                            normalizePath(store, serviceTabName, nextState, replace, getNormalizedPath);
                        }
                    }
                }
            ]
        };
    }
};



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/service/ServiceConfig.ts