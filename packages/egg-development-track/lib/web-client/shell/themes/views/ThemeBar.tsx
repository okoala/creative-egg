import React from 'react';
import { connect } from 'react-redux';

import { getSelectedThemeName } from 'shell/themes/ThemesSelectors';
import { selectTheme } from 'shell/themes/ThemesActions';

import shellStatusBarStyles from 'shell/views/ShellStatusBarView.scss';
import { Icon, IIconTarget } from 'common/components/Icon';
import { IStoreState } from 'client/IStoreState';

interface IThemeBarComponentProps {
    selectedThemeName: string;
}

interface IThemeBarComponentDispatchProps {
    onSelectTheme: (theme: string) => void;
}

interface IThemeBarComponentCombinedProps extends IThemeBarComponentProps, IThemeBarComponentDispatchProps {
}

class ThemeBarComponent extends React.Component<IThemeBarComponentCombinedProps, {}> {
    public render() {
        return (
            <div className={shellStatusBarStyles.statusBarGroup}>
                {this.renderButton('Light', 'light', Icon.paths.SunO)}
                {this.renderButton('Dark', 'dark', Icon.paths.MoonO)}
            </div>
        );
    }

    private renderButton(label: string, theme: string, iconPath: IIconTarget) {
        const { selectedThemeName, onSelectTheme } = this.props;
        const className = selectedThemeName === theme ? shellStatusBarStyles.statusBarButtonActive : shellStatusBarStyles.statusBarButton;

        return (
            <button aria-label={label} className={className} type="button" onClick={() => onSelectTheme(theme)}>
                <Icon target={iconPath} className={shellStatusBarStyles.statusBarButtonIcon} />
            </button>
        );
    }
}

function mapStateToProps(state: IStoreState): IThemeBarComponentProps {
    return {
        selectedThemeName: getSelectedThemeName(state)
    };
}

function mapDispatchToProps(dispatch): IThemeBarComponentDispatchProps {
    return {
        onSelectTheme: theme => {
            dispatch(selectTheme(theme));
        }
    };
}

/* tslint:disable-next-line:variable-name */
export const ThemeBar = connect(mapStateToProps, mapDispatchToProps)(ThemeBarComponent);



// WEBPACK FOOTER //
// ./src/client/shell/themes/views/ThemeBar.tsx