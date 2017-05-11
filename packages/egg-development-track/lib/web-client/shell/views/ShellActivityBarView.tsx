import React from 'react';
import { connect } from 'react-redux';

import { toggleOpenStateAction } from 'routes/requests/RequestsResizeActions';

import styles from './ShellActivityBarView.scss';
import { Icon } from 'common/components/Icon';

export interface IProps { children; }
export interface ICallbacks { onToggle: (e) => void; }

export class ShellActivityBarView extends React.Component<IProps & ICallbacks, {}> {
    public render() {

        return (
            <div className={styles.activityBar}>
                <div onClick={this.props.onToggle}
                     title="Request List"
                     className={`${styles.activityBarButton} ${styles.activityBarButtonActive}`}>
                    <Icon target={Icon.paths.Bars} className={styles.activityBarIcon} />
                </div>
            </div>
        );
    }
}

function mapDispatchToProps(dispatch): ICallbacks {
    return {
        onToggle: (e) => {
            dispatch(toggleOpenStateAction(undefined));
        }
    };
}

export default connect(state => state, mapDispatchToProps)(ShellActivityBarView);



// WEBPACK FOOTER //
// ./src/client/shell/views/ShellActivityBarView.tsx