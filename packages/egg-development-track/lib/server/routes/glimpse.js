'use strict';

var bodyParser = require('body-parser');
var express = require('express');
var logger = require('morgan');
var cors = require('cors');
var router = express.Router();

// Tell Glimpse to ignore this router (and its middleware)...
router.glimpse = {
    ignore: true
};

var server = require('../Server');

var resourceRuntimeModule = require('../resources/ResourceRuntime');
var resourceRuntime = new resourceRuntimeModule.ResourceRuntime(
    server.instance.providers.resourceAuthorization,
    server.instance.providers.resourceManager,
    server.instance.providers.errorReportingService);

router.use(logger('dev'));
router.use(cors());

const maxBodySize = server.instance.providers.configSettings.get('server.max.json.body.size', 135000);
router.use(bodyParser.json({ type: [ 'application/json', 'application/x-www-form-urlencoded' ], limit: maxBodySize }));

router.use(function callback() { resourceRuntime.processRequest.apply(resourceRuntime, arguments); });

module.exports = router;
