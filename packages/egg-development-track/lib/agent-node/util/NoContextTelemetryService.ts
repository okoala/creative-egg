
import { ITelemetryService, IProperties, IMeasurements } from '@glimpse/glimpse-common';
import { ContextManagerProvider } from '../messaging/ContextManagerProvider';

/**
 * This is a wrapper over the telemetry service that will strip out the glimpse request context before
 * sending any telemetry events.  We do this here in the agent because the TelemetryService is defined in
 * the @glimpse/glimpse-common package, while the context management logic is defined in @glimpse/glimpse-agent-node.
 */
export class NoContextTelemetryService implements ITelemetryService {
    private wrappedTelemetryService: ITelemetryService;
    constructor(telemetryService: ITelemetryService) {
        this.wrappedTelemetryService = telemetryService;
    }

    public isEnabled(): boolean {
        return this.wrappedTelemetryService.isEnabled();
    }

    public getSessionId(): string {
        return this.wrappedTelemetryService.getSessionId();
    }

    // tslint:disable-next-line:no-any
    public sendEvent(eventName: string, properties: IProperties, measurements: IMeasurements): any {
        const contextManager = ContextManagerProvider.getContextManager();
        contextManager.runInNullContext((context) => {
            return this.wrappedTelemetryService.sendEvent(eventName, properties, measurements);
        });
    }
}
