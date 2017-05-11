'use strict';

/*
    Grammar for event name:
    <event> :== <method-invocation-event> | <notify-event>

    <method-invocation-event> :== "invoke"<seperator><method-phase><seperator><JSNamePath>
    <notify-event> :== "notify"<seperator><module-name><seperator><event-name>

    <method-phase> :== "pre" | "post"
    <module-name> :== <JSNamepath>
    <event-name> :== **todo**
    <seperator> :== "|"
    <JSNamePath> :== See http://usejsdoc.org/about-namepaths.html for details
*/

// EVENT_INVOKE_PRE_EXPRESS_ROUTE_METHOD gets raised for multiple methods that are defined in a list, so it doesn't precisely follow naming convention
export const EVENT_EXPRESS_INVOKE_PRE_ROUTE_METHOD = 'invoke|pre|module:/express.Route#**multi-method**';
export const EVENT_EXPRESS_INVOKE_PRE_ROUTER_USE = 'invoke|pre|module:/express.Router#use';
export const EVENT_EXPRESS_INVOKE_PRE_ROUTER = 'invoke|post|module:/express.Router';
export const EVENT_EXPRESS_INVOKE_PRE_STATIC = 'invoke|post|module:/express.static';

export const EVENT_EXPRESS_INVOKE_PRE_ROUTE_DISPATCH = 'invoke|pre|module:/express.Route#dispatch';
export const EVENT_EXPRESS_INVOKE_PRE_VIEW_RENDER = 'invoke|pre|module:/express.View#render';
export const EVENT_EXPRESS_INVOKE_PRE_RESPONSE_RENDER = 'invoke|pre|module:/express.response.render';
export const EVENT_EXPRESS_INVOKE_PRE_RESPONSE_SEND = 'invoke|pre|module:/express.response.send';
export const EVENT_EXPRESS_INVOKE_PRE_RESPONSE_END = 'invoke|pre|module:/express.response.end';
export const EVENT_EXPRESS_NOTIFY_RENDER_COMPLETE = 'notify|module:/express|render-complete';
