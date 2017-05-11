import Redux from 'redux';
import { RedirectFunction, RouterState } from 'react-router';

import { IStoreState } from 'client/IStoreState';

interface IUrlData {
    requestId: string;
    detailAxis: string;
    requestAxis: string;
    responseAxis: string;
}

interface IRouteData {
    title: string;
    getUrl: (data: IUrlData) => string;
    path: string;
    component;
}

function buildRouteData(title: string, path: string, component, isRequest: boolean): IRouteData {
    return {
        title,
        getUrl: data => {
            const { requestId, detailAxis, requestAxis, responseAxis } = data;

            return `/requests/${requestId}/${detailAxis}?requestAxis=${isRequest ? path : requestAxis}&responseAxis=${isRequest ? responseAxis : path}`;
        },
        path,
        component
    };
}

export function buildRequestRouteData(title: string, path: string, component): IRouteData {
    return buildRouteData(title, path, component, /* isRequest */ true);
}

export function buildResponseRouteData(title: string, path: string, component): IRouteData {
    return buildRouteData(title, path, component, /* isRequest */ false);
}

export function createRouteConfig(list: IRouteData[]) {
    const byPath = list.reduce(
        (acc, data) => {
            acc[data.path] = data;

            return acc;
        },
        {});

    return {
        list,
        byPath
    };
}

export function normalizePath(store: Redux.Store<IStoreState>, path: string, nextState: RouterState, replace: RedirectFunction, getNormalizedPath: (params) => string) {
    let nextRequestAxis = nextState.location.query['requestAxis']; // tslint:disable-line:no-string-literal
    let nextResponseAxis = nextState.location.query['responseAxis']; // tslint:disable-line:no-string-literal

    const state = store.getState().persisted.global.requests.details.requestResponseTabStrip.route;
    const targetState = state[path] || state.default;
    const currentRequestAxis = targetState.requestTab;
    const currentResponseAxis = targetState.responseTab;

    if (!nextRequestAxis || !nextResponseAxis) {
        nextRequestAxis = nextRequestAxis || currentRequestAxis;
        nextResponseAxis = nextResponseAxis || currentResponseAxis;

        const normalizedPath = getNormalizedPath(nextState.params);

        replace({
            pathname: normalizedPath,
            query: {
                requestAxis: nextRequestAxis,
                responseAxis: nextResponseAxis
            }
        });
    }

    return {
        currentRequestAxis,
        currentResponseAxis,
        nextRequestAxis,
        nextResponseAxis
    };
}



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/components/request-response-tab-strip/RequestResponseTabStripConfig.ts