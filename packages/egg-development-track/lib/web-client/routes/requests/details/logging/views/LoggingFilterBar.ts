import { connect } from 'react-redux';

import { AgentType } from 'routes/requests/details/timeline/TimelineInterfaces';
import { LoggingMessageLevel, ILoggingAgentSummary, ILoggingLevelSummary } from '../LoggingInterfaces';
import { toggleLevelAction, toggleAgentAction, showAllAction } from '../LoggingActions';
import { getLevelFiltersSummaries, getAgentFiltersSummaries } from '../LoggingSelectors';

import styles from './LoggingFilterBar.scss';
import { Icon, IIconTarget } from 'common/components/Icon';
import { IFilterBarProps, IFilterBarCallbacks, FilterBar } from 'common/components/FilterBar';
import { IStoreState } from 'client/IStoreState';

function addAgentDisplayProperties(filter: ILoggingAgentSummary) {
    switch (filter.agent) {
        case AgentType.Browser:
            return { displayName: filter.name, icon: Icon.paths.Client, iconPathClassName: styles.agentBrowserIcon, ...filter };

        case AgentType.Server:
            return { displayName: filter.name, icon: Icon.paths.Server, iconPathClassName: styles.agentServerIcon, ...filter };

        default:
            return filter;
    }
}

function addLevelDisplayProperties(filter: ILoggingLevelSummary ) {
    let icon: IIconTarget;
    let iconPathClassName: string;

    switch (filter.level) {
        case LoggingMessageLevel.Error:
            icon = Icon.paths.TimesCircle;
            iconPathClassName = styles.levelErrorIcon;
            break;
        case LoggingMessageLevel.Warning:
            icon = Icon.paths.Warning;
            iconPathClassName = styles.levelWarningIcon;
            break;
        case LoggingMessageLevel.Info:
            icon = Icon.paths.InfoLogs;
            iconPathClassName = styles.levelInfoIcon;
            break;
        default:
            break;
    }

    return { displayName: filter.name, icon, iconPathClassName, ...filter };
}

function mapStateToProps(state: IStoreState): IFilterBarProps {
    return {
        groups: [
            { name: 'agent', filters: getAgentFiltersSummaries(state).map(addAgentDisplayProperties) },
            { name: 'level', filters: getLevelFiltersSummaries(state).map(addLevelDisplayProperties) }
        ]
    };
}

function mapDispatchToProps(dispatch): IFilterBarCallbacks {
    return {
        onShowAll: () => {
            dispatch(showAllAction());
        },
        onToggle: (name: string, groupName: string, index: number) => {
            if (groupName === 'agent') {
                dispatch(toggleAgentAction(AgentType[name]));
            }
            else if (groupName === 'level') {
                dispatch(toggleLevelAction(LoggingMessageLevel[name]));
            }
        }
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(FilterBar);



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/logging/views/LoggingFilterBar.ts