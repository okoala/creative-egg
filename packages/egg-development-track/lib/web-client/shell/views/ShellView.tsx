import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { isExperimentalMode } from 'common/util/ConfigurationUtilities';
import { IStoreState } from 'client/IStoreState';
import { getSelectedThemeName } from '../themes/ThemesSelectors';

import styles from './ShellView.scss';
import ShellActivityBarView from './ShellActivityBarView';
import ShellStatusBarView from './ShellStatusBarView';
import { ThemeBar } from '../themes/views/ThemeBar';
import DebugBar from '../debug/views/DebugBar';
import SmileyFeedback from 'shell/feedback/views/SmileyFeedback';

export interface IShellViewProps {
    messages;
    children;
    themeName: string;
}

export class ShellView extends React.Component<IShellViewProps, {}> {
    public render() {
        const { themeName, children, messages } = this.props;

        return (
            <div className={classNames(themeName, styles.shell)}>
                <div className={styles.shellContent}>
                    <div className={classNames(styles.shellContentActivityBar)}>
                        <ShellActivityBarView />
                    </div>
                    <div className={styles.shellContentDetail}>
                        <SmileyFeedback />
                        {children && React.cloneElement(children, { messages })}
                    </div>
                </div>
                <div className={styles.shellStatusBar}>
                    <ShellStatusBarView>
                        <DebugBar />
                        { isExperimentalMode() ? <ThemeBar /> : undefined }
                    </ShellStatusBarView>
                </div>
            </div>
        );
    };
};

function mapStateToProps(state: IStoreState, ownProps) {
    return {
        themeName: getSelectedThemeName(state)
    };
}

export default connect(mapStateToProps)(ShellView);



// WEBPACK FOOTER //
// ./src/client/shell/views/ShellView.tsx