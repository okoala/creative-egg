import { createActionCreator, createRequestPersistedActionCreator, createSimpleActionCreator } from 'common/actions/ActionCreator';
import { TimelineEventCategory, ITimelineSpan, ITimelineOffsetsActionConfig, AgentType } from 'routes/requests/details/timeline/TimelineInterfaces';
import { push } from 'react-router-redux';
import { getSelectedExchangePath } from 'routes/requests/details/service/ServiceConfig';
import { IMiddlewareStartPayload } from 'client/modules/messages/schemas/IMiddlewareStartPayload';

export const toggleCategoryActionID = 'request.detail.timeline.toggleCategory';
export const toggleAgentActionID = 'request.detail.timeline.toggleAgent';
export const resetAllActionID = 'request.detail.timeline.resetAll';
export const selectOffsetsActionID = 'request.detail.timeline.selectOffsets';
export const resetOffsetsActionID = 'request.detail.timeline.resetOffsets';
export const highlightOffsetsActionID = 'request.details.timeline.highlightOffsets';
export const resetHighlightedOffsetsActionID = 'request.details.timeline.resetHighlightedOffsets';

export const resetAllAction = createSimpleActionCreator(resetAllActionID);
export const toggleCategoryAction = createActionCreator<number>(toggleCategoryActionID);
export const toggleAgentAction = createActionCreator<number>(toggleAgentActionID);
export const selectOffsetsAction = createRequestPersistedActionCreator<ITimelineOffsetsActionConfig>(selectOffsetsActionID);
export const highlightOffsetsAction = createRequestPersistedActionCreator<ITimelineOffsetsActionConfig>(highlightOffsetsActionID);
export const resetOffsetsAction = createRequestPersistedActionCreator<ITimelineOffsetsActionConfig>(resetOffsetsActionID);
export const resetHighlightedOffsetsAction = createRequestPersistedActionCreator<ITimelineOffsetsActionConfig>(resetHighlightedOffsetsActionID);

export const routeActivityAction = (requestId: string, activity: ITimelineSpan) => {
    return (dispatch) => {
        const { category, eventId } = activity;

        switch (category) {
            case TimelineEventCategory.WebService:
                dispatch(push(getSelectedExchangePath(requestId, eventId)));
                break;

            case TimelineEventCategory.Request:
                if (activity.source === AgentType.Server && activity.rawMessages.length) {
                    const correlationId = (activity.rawMessages[0].payload as IMiddlewareStartPayload).correlationId;
                    dispatch(push(`/requests/${requestId}/request#${correlationId}`));
                    window.requestAnimationFrame(() => {
                        window.location.href = `${window.location.pathname}${window.location.search}#${correlationId}`;
                    });
                }
                break;

            // TODO: handle other categories
            default:
                break;
        }
    };
};



// WEBPACK FOOTER //
// ./src/client/routes/requests/details/timeline/TimelineActions.ts