import React from 'react';

export interface IMessageRowLinkProps {
    ordinal: number;
    title: string;
    className?: string;
}

/**
 * MessageRowLink and MessageRowTarget form a pair. MessageRowLink is used to
 * create an anchor that can be clicked on. Once clicked, the page will scroll
 * down to the table row indicated by MessageRowTarget. The two are "linked" when
 * they are passed the same ordinal. Scrolling is handled using URL fragments
 * and HTML element IDs.
 *
 * @class MessageRowLink
 */
export class MessageRowLink extends React.Component<IMessageRowLinkProps, {}> {
    // We do a custom onclick handler here to force the URL fragment to change,
    // even if the user clicked on a link that takes us to the current fragment.
    // This enables the `:target` css selector used in MessageRowTarget to register
    // that the user clicked the link to retrigger the animation.
    // Note: filtering this so that this logic only runs when the source and
    // destination are the same causes animation timing discrepencies, so we run
    // all cases through the same logic.
    private onClick = (e) => {
        const { ordinal } = this.props;
        window.location.href = `${window.location.pathname}${window.location.search}#`;
        window.requestAnimationFrame(() => {
            window.location.href = `${window.location.pathname}${window.location.search}#${ordinal}`;
        });
        e.preventDefault();
    }

    public render() {
        const { ordinal, title, className, children } = this.props;
        return (
            <a href={`#${ordinal}`} aria-label={title} title={title} className={className} onClick={this.onClick}>{children}</a>
        );
    }
}

export default MessageRowLink;



// WEBPACK FOOTER //
// ./src/client/common/components/MessageRowLink.tsx