import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as express from 'express';
import * as logger from 'morgan';

const router = express.Router();

// Tell Glimpse to ignore this router (and its middleware)...
(router as any).glimpse = {
  ignore: true,
};

import resourceRuntimeModule from '../resources/ResourceRuntime';
import server from '../Server';

const resourceRuntime = new resourceRuntimeModule.ResourceRuntime(
  server.instance.providers.resourceAuthorization,
  server.instance.providers.resourceManager,
  server.instance.providers.errorReportingService,
);

router.use(logger('dev'));
router.use(cors());

const maxBodySize = server.instance.providers.configSettings.get('server.max.json.body.size', 135000);
router.use(bodyParser.json({ type: ['application/json', 'application/x-www-form-urlencoded'], limit: maxBodySize }));

router.use(function callback() { resourceRuntime.processRequest.apply(resourceRuntime, arguments); });

module.exports = router;
