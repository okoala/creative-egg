import Requests from './views/Requests';

import detailConfig from './details/requests-details-config';
const { fetch: fetchMessages } = require('modules/messages/messages-actions');

const path = '/requests';
let hasAlreadyEntered = false;

export default {
    getTabData() {
        return {
            title: 'Requests',
            getUrl: () => path
        };
    },
    getRoute(store) {
        const childRoutes = [ detailConfig.getRoute(store) ];

        return {
            path,
            childRoutes,
            component: Requests,
            onEnter: () => {
                if (!hasAlreadyEntered) {
                    hasAlreadyEntered = true;
                    store.dispatch(fetchMessages());
                }
            }
        };
    }
};



// WEBPACK FOOTER //
// ./src/client/routes/requests/requests-config.js