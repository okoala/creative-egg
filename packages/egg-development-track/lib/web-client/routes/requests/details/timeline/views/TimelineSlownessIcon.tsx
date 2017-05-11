import React from 'react'; // tslint:disable-line:no-unused-variable

import Icon from 'common/components/Icon';

import styles from './TimelineSlownessIcon.scss';

// tslint:disable-next-line:variable-name
export const TimelineSlownessIcon =
    (props: { className?: string, slowness?: number }) => {
        const { className, slowness } = props;
        const target = (slowness >= 1) && (slowness <= 3)
            ? Icon.paths.Fire
            : undefined;

        let pathClassName;
        let title;

        switch (slowness) {
            case 1:
                pathClassName = styles.timelineSlownessIconSlowestPath;
                title = 'Slowest event';
                break;

            case 2:
                pathClassName = styles.timelineSlownessIconSlowerPath;
                title = '2nd slowest event';
                break;

            case 3:
                pathClassName = styles.timelineSlownessIconSlowPath;
                title = '3rd slowest event';
                break;

            default:
                pathClassName = undefined;
                break;
        }

        return (
            <div className={className} title={title}>
                <Icon target={target} className={styles.timelineSlownessIcon} pathClassName={pathClassName} />
            </div>
        );
    };

export default TimelineSlownessIcon;



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/timeline/views/TimelineSlownessIcon.tsx