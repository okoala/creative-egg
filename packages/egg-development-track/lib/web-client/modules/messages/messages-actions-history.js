import { MESSAGES_REQUESTED_BATCH_HISTORY, MESSAGES_RECEIVED_BATCH_HISTORY, MESSAGES_REQUESTED_ITEM_HISTORY, MESSAGES_RECEIVED_ITEM_HISTORY, messageSummaryTypes } from './MessagesConstants';

import { current as currentMetadata } from 'modules/metadata/MetadataActions';

// TODO: need to deal with error cases

export function fetchAll(callback) {
    return dispatch => {
        currentMetadata(metadata => {
            dispatch({ type: MESSAGES_REQUESTED_BATCH_HISTORY });

            const uri = metadata.resources['message-history']
                .fill({
                    hash: metadata.hash,
                    types: messageSummaryTypes
                });

            fetch(uri)
                .then(response => response.json())
                .then(response => {
                    var messages = response;

                    dispatch({
                        type: MESSAGES_RECEIVED_BATCH_HISTORY,
                        source: 'history',
                        messages
                    });

                    callback(messages);
                });
        });
    };
}

export function fetchByContext(contextId, callback) {
    return dispatch => {
        currentMetadata(metadata => {
            dispatch({
                type: MESSAGES_REQUESTED_ITEM_HISTORY,
                contextId
            });

            var uri = metadata.resources['context']
                .fill({
                    hash: metadata.hash,
                    contextId: contextId
                });

            return fetch(uri)
                .then(response => response.json())
                .then(response => {
                    var messages = response;

                    dispatch({
                        type: MESSAGES_RECEIVED_ITEM_HISTORY,
                        source: 'history',
                        contextId,
                        messages
                    });

                    callback(messages);
                });
        });
    };
}



// WEBPACK FOOTER //
// ./src/client/modules/messages/messages-actions-history.js