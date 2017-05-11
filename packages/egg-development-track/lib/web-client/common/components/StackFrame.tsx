import React from 'react';

import styles from './StackFrame.scss';

export interface IStackFrameProps {
    frame: {
        fileName?: string;
        lineNumber?: number;
    };
}

export default class StackFrame extends React.Component<IStackFrameProps, {}> {
    public render() {
        const { frame } = this.props;

        if (frame) {
            const { fileName } = frame;

            if (fileName) {
                const fileOnly = StackFrame.getFileFromPath(fileName);

                const fileNameSpan = <span className={styles.stackFrameFileName} title={fileName}>{fileOnly}</span>;
                const { lineNumber } = frame;
                const lineNumberText = `: ${lineNumber}`;

                if (lineNumber) {
                    return <span className={styles.stackFrame}>{fileNameSpan}<span className={styles.stackFrameLineNumber}>{lineNumberText}</span></span>;
                }
                else {
                    return <span className={styles.stackFrame}>{fileNameSpan}</span>;
                }
            }
        }

        return <span>-</span>;
    }

    /**
     * given a path, return the "file-name" portion.  Public for test purposes.
     */
    public static getFileFromPath(fileName: string): string {
        let f = fileName;
        if (f) {
            let idx1 = fileName.lastIndexOf('/');
            let idx2 = fileName.lastIndexOf('\\');

            let start = idx1 + 1;
            if (idx1 === -1 && idx2 > -1) {
                // back-slash & no forward-slash.  
                start = idx2 + 1;
            }

            let end = fileName.length;
            let hidx = fileName.indexOf('#', start);
            let qidx = fileName.indexOf('?', start);
            if (hidx > -1) {
                end = hidx;
            }
            if (qidx > -1 && qidx < hidx) {
                end = qidx;
            }

            f = fileName.substring(start, end);
        }
        return f;
    }
}



// WEBPACK FOOTER //
// ./src/client/common/components/StackFrame.tsx