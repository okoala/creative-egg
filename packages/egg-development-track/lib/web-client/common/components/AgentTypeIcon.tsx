// tslint:disable-next-line:no-unused-variable
import React from 'react';
import classNames from 'classnames';

import { AgentType } from 'routes/requests/details/timeline/TimelineInterfaces';
import Icon from './Icon';

import styles from './AgentTypeIcon.scss';

// tslint:disable-next-line:variable-name
const AgentTypeIcon =
    (props: { agentType?: AgentType, className?: string }) => {
        const { agentType, className } = props;

        let target;
        let pathClassName;
        let title;

        if (agentType === AgentType.Browser) {
            target = Icon.paths.Client;
            pathClassName = styles.agentTypeBrowserIconPath;
            title = 'Browser';
        }
        else if (agentType === AgentType.Server) {
            target = Icon.paths.Server;
            pathClassName = styles.agentTypeServerIconPath;
            title = 'Server';
        }

        return (
            <span title={title}>
                <Icon
                    target={target}
                    className={classNames(styles.agentTypeIcon, className)}
                    pathClassName={pathClassName} />
            </span>
        );
    };

export default AgentTypeIcon;



// WEBPACK FOOTER //
// ./src/client/common/components/AgentTypeIcon.tsx