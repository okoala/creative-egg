/* tslint:disable-next-line:variable-name */
export const DebugTimestampMeasurementType = 'debug-timestamp-measurement';

export interface IDebugTimestampMeasurementPayload {
    name: string;
    category?: string;
    correlationMessageIds: string[];
}



// WEBPACK FOOTER //
// ./src/client/modules/messages/schemas/IDebugTimestampMeasurementPayload.ts