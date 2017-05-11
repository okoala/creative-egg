import React from 'react';

import { CodeView } from 'routes/requests/components/CodeView';
import styles from './DataOperationCommandView.scss';

export interface IRequestDetailPanelDataOperationCommandViewProps {
    command: string;
    language: string;
}

export class RequestDetailPanelDataOperationCommandView extends React.Component<IRequestDetailPanelDataOperationCommandViewProps, {}> {
    public render() {
        const { language, command } = this.props;

        return (
            <div className={styles.commandView}>
                <CodeView language={language} code={command} />
            </div>
        );
    }
}



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/data/DataOperationCommandView.tsx