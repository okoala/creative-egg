'use strict';

import { IResource } from './IResource';
import { IServer } from './../IServer';
import { Handler } from 'express';
import express = require('express');
import path = require('path');

export class Resource implements IResource {
    public name = 'hud';
    public uriTemplate = 'main.js?hash={hash}';
    public templateName = 'hudScriptTemplate';
    public type = 'client';
    public invoke: Handler;

    constructor(server: IServer) {
        const useDevBuild = server.providers.configSettings.get('use.embedded.dev.builds', false);
        const basePath = path.join(__dirname, '../../resources/embedded/hud');
        const location = useDevBuild ? path.join(basePath, 'dev') : path.join(basePath, 'prod');
        this.invoke = express.static(location);
    }
}
