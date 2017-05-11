'use strict';

import * as http from 'http';
import * as https from 'https';
import { printBannerGreeting } from '@glimpse/glimpse-common';

export function setupProxy() {
    // Note: http.createServer and https.createServer have differnt signatures,
    // so we do each one separately here to keep things simple, even if there is
    // some duplicated code
    const oldHttpCreateServer = http.createServer;
    // tslint:disable-next-line:no-any
    (http as any).createServer = function createServer(callback, ...args) {
        const app = buildApp(callback);
        const server = oldHttpCreateServer.call(this, app, ...args);
        server.on('listening', () => {
            printBannerGreeting(`http://localhost:${server.address().port}/glimpse/client`);
        });
        return server;
    };

    const oldHttpsCreateServer = https.createServer;
    // tslint:disable-next-line:no-any
    (https as any).createServer = function createServer(options, callback, ...args) {
        const app = buildApp(callback);
        const server = oldHttpsCreateServer.call(this, options, app, ...args);
        server.on('listening', () => {
            printBannerGreeting(`https://localhost:${server.address().port}/glimpse/client`);
        });
        return server;
    };
};

function buildApp(originalCallback) {

    // NOTE: Express provides wrappers around http for starting the web server. If used,
    //       apps may not otherwise import http themselves. In that case, the only mechanism
    //       for importing http (and thereby initializing the Glimpse proxy), is importing
    //       express. Since the server uses Express itself and is initialized before the
    //       agent, it needs to defer importing express until after agent initialization.
    //       This ensures that the first import of Express is done by the app itself and
    //       after all of the proxies have been registered.

    const express = require('express');
    const glimpse = require('../routes/glimpse');

    const app = express();

    app.use('/glimpse', glimpse);

    return function f(req, res) {
        if (req.url.indexOf('/glimpse') === 0) {
            /* eslint-disable camelcase */
            req.__glimpse_inProcessServerRequest = true;
            res.__glimpse_inProcessServerResponse = true;
            /* eslint-enable camelcase */
            return app(req, res);
        }
        else {
            return originalCallback(req, res);
        }
    };
};
