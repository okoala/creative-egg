import React from 'react';
import classNames from 'classnames';

export interface IRouteButtonComponentProps {
    /**
     * Child content for button.
     */
    children?;

    /**
     * What route should be pushed to the router.
     */
    to: string;

    /**
     * Class that should be applied
     */
    className?: string;

    /**
     * Class that should be applied when button is active.
     */
    activeClassName?: string;

    /**
     * Whether the button is active and hence the activeClassName should
     * be applied.
     */
    isActive?: boolean;

    /**
     * Label that wuill be used as the title of the button
     */
    label?: string;

    /**
     * Callback which is executed onClick and overrides the default behaviour
     */
    onClick?: (props?: IRouteButtonComponentProps) => void;
}

export class RouteButton extends React.Component<IRouteButtonComponentProps, {}> {
    constructor(props) {
        super(props);

        this.onClick = this.onClick.bind(this);
    }

    public static contextTypes: React.ValidationMap<{}> = {
        router: React.PropTypes.object.isRequired
    };

    public context: {
        router;
    };

    private onClick(e: React.MouseEvent<HTMLButtonElement>) {
        const { onClick, to } = this.props;

        if (onClick) {
            onClick(this.props);
        }
        else {
            this.context.router.push(to);
        }

        e.stopPropagation();
    }

    private isActive = (): boolean => {
        const { router } = this.context;
        const { isActive } = this.props;

        // If the parent component knows whether the route is active, isActive will be `true` or `false`...
        if (isActive === undefined) {
            const { to } = this.props;

            // `undefined` means that it doesn't know, so ask the router...
            // NOTE: Re-render is not guaranteed, so in certain component hierarchies the active
            //       state may not immediately change.
            return router.isActive(to);
        }

        return isActive;
    }

    public render() {
        const { label, className, activeClassName } = this.props;

        const routeClassName = classNames(className, this.isActive() && activeClassName);

        return (
            <button
                title={label}
                className={routeClassName}
                type="button"
                onClick={this.onClick}>
                {this.props.children}
            </button>
        );
    }
};

export default RouteButton;



// WEBPACK FOOTER //
// ./src/client/common/components/RouteButton.tsx