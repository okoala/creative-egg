import React from 'react';

import styles from './ShellStatusBarView.scss';

export interface IShellStatusBarViewProps {
    children?;
}

export class ShellStatusBarView extends React.Component<IShellStatusBarViewProps, {}> {
    public render() {
        return (
            <div className={styles.statusBar}>
                { this.props.children }
            </div>
        );
    }
}

export default ShellStatusBarView;



// WEBPACK FOOTER //
// ./src/client/shell/views/ShellStatusBarView.tsx