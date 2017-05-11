'use strict';

import {IContextManager} from './IContextManager';
import {ContextManagerContinuationLocalStorage} from './ContextManagerContinuationLocalStorage';
import {ContextManagerAsyncTrack} from './ContextManagerAsyncTrack';

// TODO:  We're confusing terminology here between "service" & "provider".  Generally, a "provider"
// is the class that will implement logic for a custom behavior.  We'd then have an abstract factory 
// e.g., ContextManager.getContextManager, which would figure out which provider to use (based on command-line, 
// config properties, etc..).  It would then call a "provider" to create the correct instance.
//  
// We should clean this up when we get a chance, and make it consistent with the other glimpse "services" 
// (e.g. error logging service)
//

export class ContextManagerProvider {

    private static defaultInstance: IContextManager;

    public static getContextManager(): IContextManager {
        if (!ContextManagerProvider.defaultInstance) {
            ContextManagerProvider.defaultInstance = ContextManagerProvider.getCommandLineOverride();
            if (!ContextManagerProvider.defaultInstance) {
                //ContextManagerProvider.defaultInstance = ContextManagerProvider.createCLSContextManager();

                ContextManagerProvider.defaultInstance = ContextManagerProvider.createAsyncTrackContextManager();
            }
            /*tslint:disable:no-any */
            //Uncomment below for an easy way to see current context in debugger throughout code.  
            //(<any>process).__glimpseContextManager = ContextManagerProvider.defaultInstance;
            /*tslint:enable:no-any */
        }
        return ContextManagerProvider.defaultInstance;
    }

    private static getCommandLineOverride(): IContextManager {
        let cm: IContextManager;
        for (let i = 0; i < process.argv.length; i++) {
            const lcaseSwitch = process.argv[i].toLowerCase();
            if (lcaseSwitch === '--glimpse.contextmanager' || lcaseSwitch === '--glimpse.cm') {
                const lcaseVal = process.argv[++i].toLowerCase();
                if (lcaseVal === 'cls' || lcaseVal === 'continuationlocalstorage') {
                    cm = ContextManagerProvider.createCLSContextManager();
                    break;
                }
                else if (lcaseVal === 'async-track') {
                    cm = ContextManagerProvider.createAsyncTrackContextManager();
                    break;
                }
            }
        }
        return cm;
    }

    private static createCLSContextManager(): ContextManagerContinuationLocalStorage {
        const cm: ContextManagerContinuationLocalStorage = new ContextManagerContinuationLocalStorage();
        cm.init();
        return cm;
    }

    private static createAsyncTrackContextManager(): ContextManagerAsyncTrack {
        const cm: ContextManagerAsyncTrack = new ContextManagerAsyncTrack();
        cm.init();
        return cm;
    }
}
