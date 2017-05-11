import React from 'react';

import styles from './SideBar.scss';

export interface IShellSideBarProps {
    title: string;
    rightButtonTitle?: string;
};

interface IShellSideBarCallbacks {
    rightButtonOnClick?: () => void;
};

class SideBar extends React.Component<IShellSideBarProps & IShellSideBarCallbacks, {}> {
    public render() {
        const {
            title,
            children,
            rightButtonOnClick,
            rightButtonTitle
        } = this.props;

        return (
            <div className={styles.sideBar}>
                <div className={styles.title}>
                    <div className={styles.titleRequests}> {title} </div>
                    <div className={styles.rightButton}
                         onClick={rightButtonOnClick}>
                            {rightButtonTitle}
                    </div>
                </div>
                {children}
            </div>
        );
    }
}

export default SideBar;



// WEBPACK FOOTER //
// ./src/client/common/components/SideBar.tsx