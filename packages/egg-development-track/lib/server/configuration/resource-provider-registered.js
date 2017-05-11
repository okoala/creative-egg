'use strict';

var server = require('../Server');

var provider = (function buildProvider() {
    var resources = null;
    
    var getResourceDefinitions = function getResourceDefinitions(callback) {
        if (resources) {
            callback(resources);
            return;
        }
        
        var baseUri = 'http://localhost:3000/glimpse'; // TODO: shouldn't be hard coded
        var resourceUris = server.instance.providers.resourceManager.getUriTemplates(baseUri);
                
        callback(resourceUris);
    };
    
    return {
        getResourceDefinitions: getResourceDefinitions
    };
})();

module.exports = provider;
