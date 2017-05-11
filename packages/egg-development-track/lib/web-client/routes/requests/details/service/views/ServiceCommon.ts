import { IIconTarget, Icon } from 'common/components/Icon';
import { StatusCodeClass } from '../ServiceInterfaces';

import styles from './ServiceCommon.scss';

const statusCodeColors = {
    [StatusCodeClass.ClientError]: styles.statusCodeClientErrorColor,
    [StatusCodeClass.Informational]: styles.statusCodeInformationalColor,
    [StatusCodeClass.Other]: styles.statusCodeOtherColor,
    [StatusCodeClass.Redirection]: styles.statusCodeRedirectionColor,
    [StatusCodeClass.ServerError]: styles.statusCodeServerErrorColor,
    [StatusCodeClass.Success]: styles.statusCodeSuccessColor
};

const statusCodeIcons = {
    [StatusCodeClass.ClientError]: Icon.paths.Circle,
    [StatusCodeClass.Informational]: Icon.paths.Circle,
    [StatusCodeClass.Other]: Icon.paths.Triangle,
    [StatusCodeClass.Redirection]: Icon.paths.Triangle,
    [StatusCodeClass.ServerError]: Icon.paths.Circle,
    [StatusCodeClass.Success]: Icon.paths.Square
};

export function getColorStyleForStatusCode(statusCode: StatusCodeClass): string {
    return statusCodeColors[statusCode] || styles.statusCodeOtherColor;
}

export function getIconForStatusCode(statusCode: StatusCodeClass): IIconTarget {
    return statusCodeIcons[statusCode] || Icon.paths.Triangle;
}



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/service/views/ServiceCommon.ts