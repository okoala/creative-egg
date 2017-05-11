import React from 'react';

import styles from './ErrorScreen.scss';

export class ErrorScreen extends React.Component<{}, {}> {
    public render() {
        return (
            <div className={styles.errorScreen}>
                <div className={styles.imageWithText}>
                    <div className={styles.image}></div>
                    <div className={styles.description}>
                        Something went really wrong. Try restarting Glimpse.
                    </div>
                </div>
            </div>
        );
    }
}

export default ErrorScreen;



// WEBPACK FOOTER //
// ./src/client/common/components/ErrorScreen.tsx