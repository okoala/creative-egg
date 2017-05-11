import React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';

import styles from './SideBarSection.scss';
import Icon from 'common/components/Icon';
import { toggleFollowModeAction } from 'routes/requests/RequestsActions';
import { getFollowMode } from 'routes/requests/RequestsSelector';

export interface IShellSideBarContainerProps {
    title: string;
    isExpandable?: boolean;
    isImportant?: boolean;
    noChildText?: string;
}

interface IShellSideBarContainerStoreProps {
    followMode: boolean;
}

interface IShellSideBarContainerCallbacks {
    onToggleFollowMode: () => void;
}

class SideBarSection extends React.Component<IShellSideBarContainerProps & IShellSideBarContainerStoreProps & IShellSideBarContainerCallbacks, {}> {
    public static defaultProps = {
        isExpandable: true,
        isImportant:  false,
        noChildText: 'No records yet.'
    };

    public render() {
        const content = this.props.children
            ? this.props.children
            : <div className={styles.sideBarNoRecords}>{ this.props.noChildText }</div>;
        const { onToggleFollowMode, followMode } = this.props;

        return (
            <div className={classNames(styles.sideBar, { [styles.sideBarTitleIsImportant]: this.props.isImportant, [styles.sideBarIsExpandable]: this.props.isExpandable })}>
                <div className={styles.sideBarTitleHolder}>
                    <div className={styles.sideBarTitle}>
                        {this.props.title}
                    </div>
                    <div title="Automatically select the latest HTML request (excluding Ajax requests).">
                        <Icon
                            target={Icon.paths.FollowMode}
                            className={classNames(styles.sideBarAction, {
                                [styles.sideBarActionActive]: followMode
                            })}
                            pathClassName={styles.sideBarActionPath}
                            onClick={onToggleFollowMode} />
                    </div>
                </div>
                <div className={styles.sideBarContent}>
                    {content}
                </div>
            </div>
        );
    }
}

function mapStateToProps(state, ownProps: IShellSideBarContainerProps): IShellSideBarContainerStoreProps {
    return {
        followMode: getFollowMode(state)
    };
}

function mapDispatchToProps(dispatch, ownProps: IShellSideBarContainerProps): IShellSideBarContainerCallbacks {
    return {
        onToggleFollowMode: () => {
            dispatch(toggleFollowModeAction());
        }
    };
}

const ConnectedSidebarSection: React.ComponentClass<IShellSideBarContainerProps> = connect(mapStateToProps, mapDispatchToProps)(SideBarSection); /* tslint:disable-line:variable-name */

export default ConnectedSidebarSection;



// WEBPACK FOOTER //
// ./src/client/common/components/SideBarSection.tsx