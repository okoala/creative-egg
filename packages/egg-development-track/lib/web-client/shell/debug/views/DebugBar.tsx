import React from 'react';
import { connect } from 'react-redux';

import { getVersions, getClientVersion } from 'modules/metadata/MetadataSelectors';
import { getDebugEnabled } from 'shell/debug/DebugSelectors';
import { toggleDebugEnabled } from 'shell/debug/DebugActions';
import SmileyButton from './SmileyButton';

import shellStatusBarStyles from 'shell/views/ShellStatusBarView.scss';
import { Icon } from 'common/components/Icon';
import { IStoreState } from 'client/IStoreState';
import DebugInputButton from './DebugInputButton';

interface IDebugBarProps {
    allVersions: {
        [key: string]: string
    };
    clientVersion: string;
    debugEnabled: boolean;
}

interface IDebugBarCallbacks {
    onToggleDebug: () => void;
}

interface IDebugBarCombinedProps extends IDebugBarProps, IDebugBarCallbacks {
}

export class DebugBar extends React.Component<IDebugBarCombinedProps, {}> {
    public render() {
        return (
            <div className={shellStatusBarStyles.statusBarGroup}>
                {this.renderVersionInfo()}
                {DEBUG ? this.renderDebugButton() : undefined}
                {DEBUG ? <DebugInputButton /> : undefined}
                <SmileyButton />
            </div>
        );
    }

    private renderVersionInfo() {
        const { clientVersion, allVersions } = this.props;
        const title = Object.keys(allVersions).map((key) => `${key}: ${allVersions[key]}`).join('\n');

        return (<span title={title} className={shellStatusBarStyles.version}>{clientVersion}</span>);
    }

    private renderDebugButton() {
        const { debugEnabled, onToggleDebug } = this.props;
        const title = debugEnabled ? 'Start Debugging' : 'Stop Debugging';
        const buttonStyle = debugEnabled ? shellStatusBarStyles.statusBarButtonActive : shellStatusBarStyles.statusBarButton;

        return (
            <button aria-label={title} className={buttonStyle} type="button" onClick={onToggleDebug}>
                <Icon target={Icon.paths.Debug} className={shellStatusBarStyles.statusBarButtonIcon} />
            </button>
        );
    }
}

function mapStateToProps(state: IStoreState): IDebugBarProps {
    return {
        allVersions: getVersions(state),
        clientVersion: getClientVersion(state),
        debugEnabled: getDebugEnabled(state)
    };
}

function mapDispatchToProps(dispatch): IDebugBarCallbacks {
    return {
        onToggleDebug: () => {
            dispatch(toggleDebugEnabled());
        }
    };
}

/* tslint:disable-next-line:variable-name */
export default connect(mapStateToProps, mapDispatchToProps)(DebugBar);



// WEBPACK FOOTER //
// ./src/client/shell/debug/views/DebugBar.tsx