import { getFiltersSelector } from './DataSelectors';
import { IFilterBarProps, IFilterBarCallbacks, FilterBar } from 'common/components/FilterBar';
import { IStoreState } from 'client/IStoreState';
import { toggleFilterAction, showAllAction } from './DataActions';

import { connect } from 'react-redux';

function mapStateToProps(state: IStoreState): IFilterBarProps {
    return {
        groups: [
            { name: 'db', filters: getFiltersSelector(state) }
        ]
    };
}

function mapDispatchToProps(dispatch): IFilterBarCallbacks {
    return {
        onShowAll: () => {
            dispatch(showAllAction());
        },
        onToggle: (name: string) => {
            dispatch(toggleFilterAction(name));
        }
    };
}

/* tslint:disable-next-line:variable-name */
export const DataFilterBarContainer = connect(mapStateToProps, mapDispatchToProps)(FilterBar);



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/data/DataFilterBarContainer.ts