import React from 'react';
import bytes from 'bytes';
import classNames from 'classnames';

import { isObject } from 'common/util/CommonUtilities';
import { getMediaTypeMetadata } from 'common/util/ContentTypes';

import styles from './BodyView.scss';
import commonStyles from 'common/components/Common.scss';

import { BodyType, IMultipartPart, IRequestResponseBodyResult } from './BodyInterfaces';
import { CodeView } from 'routes/requests/components/CodeView';
import { InformationLabel } from 'common/components/InformationLabel';
import MultipartSummary from './MultipartSummary';
import { ParameterList, IParameterValue } from 'common/components/ParameterList';

export class BodyView extends React.Component<IRequestResponseBodyResult, {}>{
    public render() {
        const { bodyType, isSupported, mediaType, elementId, requestId } = this.props;
        let { content } = this.props;

        let component;
        if (content) {
            if (typeof content === 'string') {
                content = content as string;
                component = <CodeView language={this.getClassNameForContentType()} code={content} elementId={elementId} requestId={requestId} />;
            }
            else if (bodyType === BodyType.Multipart) {
                component = <MultipartSummary className={styles.contentTable} parts={(content as IMultipartPart[])} />;
            }
            else if (isObject(content)) {
                content = content as IParameterValue;
                component = <ParameterList className={styles.contentTable} params={content} />;
            }
            else {
                component = content;
            }
        }
        else if (!isSupported) {
            const message = !mediaType ? 'Empty `content-type` requests not currently supported' : '`' + mediaType + '` support coming soon';
            component = <div className={classNames(styles.message, commonStyles.noData)}>{message}</div>;
        }
        else {
            component = <div className={classNames(styles.message, commonStyles.noData)}>No body content found</div>;
        }

        return (
            <div className={styles.body}>
                {this.renderMetadata()}
                {this.renderContentMessage()}
                <div className={styles.content}>
                    {component}
                </div>
            </div>
        );
    }

    private renderContentMessage() {
        const { content, isTruncated } = this.props;

        if (content && isTruncated) {
            return <InformationLabel text="Maximum viewable content reached. Result has been truncated for display purposes." textClassName={styles.contentMessage} />;
        }
    }

    private renderMetadata() {
        const { size, mediaType, contentType, isSupported, content } = this.props;

        const displaySize = size !== undefined ? bytes.format(size, { unitSeparator: ' ' }) : '--';

        if (isSupported && content) {
            return (
                <div className={styles.metadata}>
                    {displaySize}<span className={styles.metadataSpacer}></span><span title={contentType}>{mediaType}</span>
                </div>
            );
        }
    }

    private getClassNameForContentType(): string {
        const { mediaType } = this.props;

        const categories = getMediaTypeMetadata(mediaType);

        return categories && categories.highlight || '';
    }
}

export default BodyView;



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/components/request-response-tab-strip/body/BodyView.tsx