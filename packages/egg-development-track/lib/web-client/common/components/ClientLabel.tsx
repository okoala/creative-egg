import React from 'react';
import { parse } from 'platform';
import classNames from 'classnames';

import { Icon, IIconTarget } from './Icon';
import styles from './ClientLabel.scss';
import commonStyles from './Common.scss';

interface IClientLabelProps {
    userAgent: string;
    showIconOnly?: boolean;
    className?: string;
}

const SAFARI_CFNETWORK_UA_TEST = /^Safari\/[0-9\.]* CFNetwork\/[0-9\.]* Darwin\//;

export class ClientLabel extends React.PureComponent<IClientLabelProps, {}> {
    public render() {
        const { userAgent, showIconOnly, className } = this.props;

        // Note: if the userAgent is falsey, it queries the browser it's in
        // for it's user agent. We don't want that so we force it to a non-existent
        // user agent. If the user agent cannot be parsed, the parsed object is
        // returned with all fields set to null.
        let browserName = parse(userAgent || '-').name;
        let browserIcon: IIconTarget;
        switch (browserName) {
            case 'Chrome':
                browserIcon = Icon.paths.Browsers.Chrome;
                break;
            case 'Firefox':
                browserIcon = Icon.paths.Browsers.Firefox;
                break;
            case 'Microsoft Edge':
                browserIcon = Icon.paths.Browsers.Edge;
                break;
            case 'IE':
                browserIcon = Icon.paths.Browsers.IE;
                break;
            case 'Safari':
                browserIcon = Icon.paths.Browsers.Safari;
                break;
            case 'Opera':
                browserIcon = Icon.paths.Browsers.Opera;
                break;
            default:
                // Safari _sometimes_ reports this strange alternate form of user
                // agent that platform doesn't understand, so we manually check
                // for it here.
                if (SAFARI_CFNETWORK_UA_TEST.test(userAgent)) {
                    browserIcon = Icon.paths.Browsers.Safari;
                    browserName = 'Safari';
                } else {
                    browserIcon = Icon.paths.QuestionMark;
                }
                break;
        }

        let text, title;
        if (!browserName) {
            const displayUserAgent = userAgent || 'Unknown';
            text = !showIconOnly ? <span className={commonStyles.trimText}>{`${displayUserAgent}`}</span> : undefined;
            title = `User Agent: ${displayUserAgent}`;

        }
        else {
            text = !showIconOnly ? <span className={commonStyles.trimText}>{browserName}</span> : undefined;
            title = `Client: ${browserName}\nUser Agent: ${userAgent}`;
        }

        return (
            <span title={title} className={styles.clientLabelContainer}>
                <Icon className={classNames(className, styles.clientLabelIcon)} target={browserIcon} />
                {text}
            </span>
        );
    }
}



// WEBPACK FOOTER //
// ./src/client/common/components/ClientLabel.tsx