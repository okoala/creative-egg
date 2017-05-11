import map from 'lodash/map';
import sortBy from 'lodash/sortBy';
import React from 'react';

import { FixedWidthLeftColumnTable, IColumnInfo } from './FixedWidthLeftColumnTable';

export interface IParameterValue {
    [key: string]: string | string[];
}

export interface IParameterListProps {
    className?: string;
    params: IParameterValue;
}

export class ParameterList extends React.Component<IParameterListProps, {}> {
    public render() {
        const { className, params } = this.props;

        const flattenedParamList = map(params, (value: string | string[], key: string) => ({ name: key, value: value }))
            .map(pair => Array.isArray(pair.value)
                ? pair.value.map(value => ({ name: pair.name, value: value }))
                : [ { name: pair.name, value: pair.value }])
            .reduce((mappedParams, param) => mappedParams.concat(param), []);
        const paramList = sortBy(flattenedParamList, pair => pair.name);

        const columnInfos: IColumnInfo[] = [
            {
                header: 'Name',
                maxWidth: 200,
                valueFunc: (o: { name: string; value: string; }) => { return o.name; },
                titleFunc: (o: { name: string; value: string; }) => { return o.name; }
            },
            {
                header: 'Value',
                valueFunc: (o: { name: string; value: string; }) => { return o.value; }
            }
        ];

        return <FixedWidthLeftColumnTable className={className} columns={columnInfos} params={paramList} />;
    }
}

export default ParameterList;



// WEBPACK FOOTER //
// ./src/client/common/components/ParameterList.tsx