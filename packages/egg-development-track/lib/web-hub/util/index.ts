import UriTemplate from 'uri-templates';

const usedMessageTypes = function() {
  return 'environment,user-identification,web-response,web-request,after-action-invoked,after-action-view-invoked,before-execute-command,after-execute-command,after-view-component';
};

const hudScriptElement = document.getElementById('__egg_track');

module.exports = {
  toCamelCase(value) {
    return value.replace(camelCaseRegEx, function(match, p1, p2, offset) {
      if (p2) {
        return p2.toUpperCase();
      }
      return p1.toLowerCase();
    });
  },

  currentRequestId() {
    return hudScriptElement.getAttribute('data-request-id');
  },

  resolveClientUrl(requestId, follow) {
    const clientTemplate = new UriTemplate(
      hudScriptElement.getAttribute('data-client-template')
    );

    return clientTemplate.fill({
      requestId,
      follow,
      metadataUri: hudScriptElement.getAttribute('data-metadata-template'),
    });
  },

  resolveContextUrl(requestId) {
    const contextTemplate = hudScriptElement.getAttribute(
      'data-context-template'
    );
    const params = requestId + '&types=' + usedMessageTypes();
    const uri = contextTemplate.replace('{contextId}{&types}', params); // TODO: This should probably be resolved with a URI Template library

    return encodeURI(uri);
  },
};
