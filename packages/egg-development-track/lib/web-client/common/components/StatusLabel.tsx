'use strict';

import React from 'react';
import * as statuses from 'statuses';

import { Icon } from './Icon';
import styles from './StatusLabel.scss';
import commonStyles from './Common.scss';
import classNames from 'classnames';

interface IStatusLabelProps {
    statusCode: number;
    statusMessage?: string;
    className?: string;
}

export class StatusLabel extends React.Component<IStatusLabelProps, {}> {
    public render() {
        const { statusCode, statusMessage, className } = this.props;
        const rootClassName = classNames(styles.statusLabelContainer, className);
        const statusDescription = typeof statusMessage === 'string'
            ? statusMessage
            : statuses[statusCode];

        if (statusCode <= 0) {
            let message: string;
            switch (statusCode) {
                case -2:
                    message = 'Status code unavailable (opaque redirect)';
                    break;
                case -1:
                    message = 'Status code unavailable (opaque response)';
                    break;
                default:
                    message = 'Status code unavailable';
                    break;
            }

            const descriptionClassName = classNames(
                commonStyles.trimText,
                styles.statusLabelUnavailableDescription
            );

            return (
                <div title={message} className={rootClassName}>
                    <div className={styles.statusLabelBlankIcon} />
                    <span className={descriptionClassName} title={message}>
                        {message}
                    </span>
                </div>
            );
        }

        // Get the description for the status code, e.g. "Not Found" for 404. If
        // there is no description available, we just use the status code
        let displayStatus;
        if (statusDescription) {
            displayStatus = `${statusCode} ${statusDescription}`;
        } else {
            displayStatus = statusCode;
        }

        // Figure out which icon to use
        let icon;
        if (statusCode < 200) { // 200s are considered "info" like
            icon = <Icon
                        target={Icon.paths.Circle}
                        className={styles.statusLabelBlueIcon} />;
        }
        else if (statusCode < 300) { // 200s are considered "info" like
            icon = <Icon
                        target={Icon.paths.Square}
                        className={styles.statusLabelGreenIcon} />;
        }
        else if (statusCode < 400) { // 300s are considered "warning" like
            icon = <Icon
                        target={Icon.paths.Triangle}
                        className={styles.statusLabelYellowIcon} />;
        }
        else { // 400s and 500s are considered "error" like
            icon = <Icon
                        target={Icon.paths.Circle}
                        className={styles.statusLabelRedIcon} />;
        }

        return (
            <div title={displayStatus} className={rootClassName}>
                {icon}<span className={commonStyles.trimText}>{displayStatus}</span>
            </div>
        );
    }
}

export default StatusLabel;



// WEBPACK FOOTER //
// ./src/client/common/components/StatusLabel.tsx