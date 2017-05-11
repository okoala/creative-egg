import React from 'react';

import { LoggingMessageLevel } from '../LoggingInterfaces';

import styles from './LoggingLevelIcon.scss';
import { Icon, IIconTarget } from 'common/components/Icon';

export interface ILevelIconProps {
    level: LoggingMessageLevel;
}

export class LevelIcon extends React.Component<ILevelIconProps, {}> {
    public render() {
        const level = this.props.level;
        let target: IIconTarget;
        let pathClassName: string;

        switch (level) {
            case LoggingMessageLevel.Error:
                target = Icon.paths.TimesCircle;
                pathClassName = styles.iconPathError;

                break;
            case LoggingMessageLevel.Warning:
                target = Icon.paths.Warning;
                pathClassName = styles.iconPathWarning;

                break;
            case LoggingMessageLevel.Info:
                target = Icon.paths.InfoLogs;
                pathClassName = styles.iconPathInfo;

                break;
            default:
                break;
        }

        return <Icon target={target} className={styles.icon} pathClassName={pathClassName} />;
    }
}

export default LevelIcon;



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/logging/views/LoggingLevelIcon.tsx