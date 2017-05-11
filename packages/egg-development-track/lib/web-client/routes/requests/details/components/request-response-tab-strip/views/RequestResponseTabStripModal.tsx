import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import Modal from 'react-modal';

import { IStoreState } from 'client/IStoreState';
import { getSelectedRequest } from 'routes/requests/details/RequestsDetailsSelector';
import { getSelectedThemeName } from 'shell/themes/ThemesSelectors';

import styles from './RequestResponseTabStripModal.scss';
import commonStyles from 'common/components/Common.scss';
import { Icon } from 'common/components/Icon';
import UrlText from 'common/components/UrlText';

interface IRequestResponseTabStripModalProps {
    title: string;
    className?: string;
    modalClassName?: string;
    theme: string;
    url: string;
    protocol: string;
}

interface IRequestResponseTabStripModalState {
    modalIsOpen: boolean;
}

export class RequestResponseTabStripModal extends React.Component<IRequestResponseTabStripModalProps, IRequestResponseTabStripModalState> {
    constructor(props) {
        super(props);

        this.state = { modalIsOpen: false };
    }

    private openModal = () => { this.setState({ modalIsOpen: true }); }

    private closeModal = () => { this.setState({ modalIsOpen: false }); }

    public render() {
        const { title, className, modalClassName, theme, url, protocol } = this.props;
        const { modalIsOpen } = this.state;

        return (
            <div className={className}>
                <button onClick={this.openModal} className={styles.expand}><Icon target={Icon.paths.FullScreenExpand} className={styles.expandIcon} /> Expand View</button>
                <Modal
                    isOpen={modalIsOpen}
                    onRequestClose={this.closeModal}
                    className={classNames(commonStyles.modal, modalClassName)}
                    overlayClassName={classNames(theme, commonStyles.modalOverlay)}
                    contentLabel={title}>
                    <div className={commonStyles.modalInner}>
                        <button onClick={this.closeModal} className={commonStyles.modalClose}><Icon target={Icon.paths.Close} className={commonStyles.modalCloseIcon} /></button>
                        <div className={styles.titleHolder}>
                            <h3 className={styles.title}>{title}</h3>
                            <div className={styles.titleUrlHolder}>
                                <UrlText url={url} protocol={protocol} />
                            </div>
                        </div>
                        {this.props.children}
                    </div>
                </Modal>
            </div>
        );
    }
}

export interface IConnectedRequestResponseTabStripModalProps {
    title: string;
    className?: string;
    modalClassName?: string;
}

function mapStateToProps(state: IStoreState, ownProps: IConnectedRequestResponseTabStripModalProps): IRequestResponseTabStripModalProps {
    const { title, className, modalClassName } = ownProps;

    const selectedRequest = getSelectedRequest(state);
    const webRequest = selectedRequest.webRequest;

    return {
        title,
        className,
        modalClassName,
        theme: getSelectedThemeName(state),
        url: webRequest.url,
        protocol: webRequest.protocol.identifier
    };
}

export default connect(mapStateToProps)(RequestResponseTabStripModal) as React.ComponentClass<IConnectedRequestResponseTabStripModalProps>;



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/components/request-response-tab-strip/views/RequestResponseTabStripModal.tsx