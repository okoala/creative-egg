import { DataOperationSummaryConnection } from './DataOperationSummaryConnection';
import { DataOperationSummaryGeneralInfoContainer } from './DataOperationSummaryGeneralInfoContainer';
import { DataOperationSummaryParameters } from './DataOperationSummaryParameters';

import values from 'lodash/values';

interface IUrlData {
    requestId: string;
    operationId: string;
}

interface IRouteData {
    title: string;
    getUrl: (data: IUrlData) => string;
    path: string;
    component;
}

export function buildRouteData(title: string, path: string, component): IRouteData {
    return {
        title,
        getUrl: data => {
            return `/requests/${data.requestId}/data/${data.operationId}?summaryAxis=${path}`;
        },
        path,
        component
    };
}

export function createRouteConfig(operationRouteData: { [key: string]: IRouteData }) {
    const operationRouteDataList = values<IRouteData>(operationRouteData);

    return {
        getOperationRouteData(): IRouteData[] {
            return operationRouteDataList;
        },
        getOperationRouteMap(): { [key: string]: IRouteData } {
            return operationRouteData;
        }
    };
}

export const generalInfoRouteData = buildRouteData('General Info', 'general', DataOperationSummaryGeneralInfoContainer);
export const paramsRouteData = buildRouteData('Parameters', 'params', DataOperationSummaryParameters);
export const connectionRouteData = buildRouteData('Connection', 'connection', DataOperationSummaryConnection);

const routeData: { [key: string]: IRouteData } = {};

routeData[generalInfoRouteData.path] = generalInfoRouteData;
routeData[paramsRouteData.path] = paramsRouteData;
routeData[connectionRouteData.path] = connectionRouteData;

export default createRouteConfig(routeData);



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/data/DataOperationSummaryTabStripConfig.ts