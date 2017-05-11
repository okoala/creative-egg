import React from 'react';

import styles from './FilterBar.scss';
import { IFilterButtonProps, FilterButton } from './FilterButton';

export interface IFilterGroupProps {
    name: string;
    filters: IFilterButtonProps[];
}

export interface IFilterBarProps {
    groups: IFilterGroupProps[];
}

export interface IFilterBarCallbacks {
    onShowAll: () => void;
    onToggle: (name: string, groupName: string, index: number) => void;
}

interface IFilterBarCombinedProps extends IFilterBarProps, IFilterBarCallbacks {
}

export class FilterBar extends React.Component<IFilterBarCombinedProps, {}> {
    public render() {
        const { groups, onToggle } = this.props;
        const items = [];
        let isFilterApplied = false;

        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];

            if (i) {
                items.push(this.renderSeparator(`${group.name}-group-separator`));
            }

            for (let j = 0; j < group.filters.length; j++) {
                const filter = group.filters[j];

                // if one of the filter button is hidden - filter is applied
                if (filter.isShown === false) {
                    isFilterApplied = true;
                }

                items.push(<FilterButton count={filter.count} key={`${group.name}-${filter.name}-button`} icon={filter.icon} iconClassName={filter.iconClassName} iconPathClassName={filter.iconPathClassName} isShown={filter.isShown} name={filter.name} displayName={filter.displayName} onToggle={() => onToggle(filter.name, group.name, j)} />);
            }
        }

        return (
            <div className={styles.filterBar}>
                { items }
                { this.renderResetFilter(isFilterApplied) }
            </div>
        );
    }

    private renderSeparator(key: string) {
        return <div key={key} className={styles.filterGroupSeparator} />;
    }

    private renderResetFilter(isFilterApplied: boolean): Array<JSX.Element> {
        if (!isFilterApplied) { return null; } /* tslint:disable-line:no-null-keyword */

        return [
            this.renderSeparator(`reset-filters-separator`),
            <button key={'reset-filters-button'} className={styles.filterShowAll} onClick={this.props.onShowAll}>Reset filters</button>
        ];
    }
}



// WEBPACK FOOTER //
// ./src/client/common/components/FilterBar.tsx