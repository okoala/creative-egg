import React from 'react';
import classNames from 'classnames';

import styles from './FilterButton.scss';
import { Icon, IIconTarget } from './Icon';

export interface IFilterButtonProps {
    count: number;
    icon?: IIconTarget;
    iconClassName?: string;
    iconPathClassName?: string;
    isShown: boolean;
    key?: string;
    name: string;
    displayName?: string;
}

export interface IFilterButtonCallbacks {
    onToggle: () => void;
}

interface IFilterButtonCombinedProps extends IFilterButtonProps, IFilterButtonCallbacks{
}

export class FilterButton extends React.Component<IFilterButtonCombinedProps, {}> {
    public render() {
        const className = this.props.isShown ? styles.filterButtonShown : styles.filterButtonNotShown;

        return (
            <button className={className} type="button" onClick={e => this.props.onToggle()}>
                <div className={styles.filterButtonContent}>
                    { this.renderIcon() } {this.props.displayName || this.props.name} ({this.props.count})
                </div>
            </button>
        );
    }

    private renderIcon() {
        const { icon, iconClassName, iconPathClassName } = this.props;

        if (icon) {
            return <Icon className={classNames(styles.filterButtonIcon, iconClassName)} pathClassName={iconPathClassName} target={icon} />;
        }
        else {
            return null; /* tslint:disable-line:no-null-keyword */
        }
    }
}



// WEBPACK FOOTER //
// ./src/client/common/components/FilterButton.tsx