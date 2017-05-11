'use strict';

import {IConfigSettings, IValueChangedCallback} from './IConfigSettings';

/*tslint:disable:no-var-requires */
const cc = require('config-chain');
/*tslint:enable:no-var-requires */

import events = require('events');
import path = require('path');
import fs = require('fs');

/**
 * A class to encapsulate configuration settings for the application.
 */
export class ConfigSettings extends events.EventEmitter implements IConfigSettings {

    public static EVENT_VALUE_CHANGED = 'changed';

    private _config;
    private _localOverrides = {};

    /**
     * Construct a new ConfigSettings instance.  The values will be retrieved in the following order:
     *   local overrides
     *   command-line values - 
     *   environmant variables
     *   local configuration file
     *   default configuration file
     * 
     * @commandLineArgs - an object containing key/value pairs of command-line args, or a string which specifies the variable 
     *                    name prefix to use as a filter over process.argv.  Args are assumed to be of the form
     *                    "--prefix<name> value" 
     * @commandLineArgs - an object containing key/value pairs of command-line args, or a string which specifies the variable 
     *                    name prefix to use as a filter over process.argv.
     * @localConfigFilePath - optional. path to the local configuration settings file.
     * @defaultConfigFilePath - optional. path to the default configuration settings file.
     */
    public constructor(commandLineArgs: Object | string, environmentVariables: Object | string, localConfigFilePath?: string, defaultConfigFilePath?: string) {
        super();

        if (typeof commandLineArgs === 'string') {
            commandLineArgs = ConfigSettings.filterCommandLineArgs(<string>commandLineArgs, process.argv);
        }
        else if (typeof commandLineArgs !== 'object') {
            commandLineArgs = {};
        }

        if (typeof environmentVariables === 'string') {
            environmentVariables = ConfigSettings.filterEnvironmentArgs(<string>environmentVariables, process.env);
        }
        else if (typeof environmentVariables !== 'object') {
            environmentVariables = {};
        }

        this._config = cc(
            this._localOverrides,
            commandLineArgs, // command-line options take first precedent  
            environmentVariables, // environment variables prefixed with glimpse_
            localConfigFilePath, // custom config file
            defaultConfigFilePath // default config file
        );
    }

    /**
     * filter out command-line args to include only those that contain the specified prefix. 
     * args are the given args array, or process.argv if args is not specified. 
     */
    public static filterCommandLineArgs(prefix: string, args?: string[]) {
        args = args || process.argv;
        const filteredArgs = {};
        for (let i = 0; i < args.length; i++) {
            const curr = <string>args[i];
            if (curr.indexOf(prefix) === 0 && (i < args.length - 1)) {
                const key = curr.substring(prefix.length, args[i].length);
                filteredArgs[key] = args[i + 1];
                i++;
            }
        }
        return filteredArgs;
    }

    /**
     * filter out the environment variables to include only those that contain the specified
     * prefix.  Args are given by the specifed object, or process.env is used if args not specified. 
     */
    public static filterEnvironmentArgs(prefix: string, args?: Object) {
        args = args || process.env;
        return cc.env(prefix, args);
    }

    /**
     * get the value of the given property name
     */
    public get(name: string, defaultVal?) {
        let v = this._config.get(name);
        if (v === undefined) {
            v = defaultVal;
        }
        return v;
    }

    /**
     *  return the value for the specified property as a boolean, or defaultVal if this property doesn't exist.
     */
    public getBoolean(name: string, defaultVal?: boolean): boolean {
        let v = this._config.get(name);
        if (v !== undefined) {
            v = this.parseBool(v);
        }

        if (v === undefined) {
            v = defaultVal;
        }
        return v;
    }

    /*
     *  set a new value for the given prooperty name.  Will override any existing values. 
     */
    public set(name: string, value: string | boolean | number) {
        const oldVal = this._config.get(name);
        this._config.set(name, value);
        this.emit(ConfigSettings.EVENT_VALUE_CHANGED, name, oldVal, value);
    }

    /*
     *  register given callback for when a config settings value changes
     */
    public onValueChanged(cb: IValueChangedCallback) {
        this.on(ConfigSettings.EVENT_VALUE_CHANGED, cb);
    }

    /**
     *  search for a file named fileName, starting at startPath, and walking up the directory hierarchy. 
     *   return full path of found file, or undefined if file isn't found.    
     */
    public static findFile(startPath, fileName) {
        let dirName = startPath;
        let testPath = undefined;
        let stat = undefined;
        do {
            testPath = path.join(dirName, fileName);
            try {
                stat = fs.statSync(testPath);
            }
            catch (err) {
                // swallow error if file doesn't exist
            }
            dirName = path.dirname(dirName);
        } while ((!stat || !stat.isFile()) && dirName !== path.dirname(dirName));
        return (stat && stat.isFile()) ? testPath : undefined;
    }

    /**
     * convert a value into a boolean value
     */
    private parseBool(v) {
        let rtrn;
        if (typeof v === 'boolean') {
            rtrn = v;
        }
        else if (typeof v === 'string') {
            rtrn = (v.toLowerCase() === 'true');
        }
        else if (typeof v === 'number') {
            rtrn = v !== 0;
        }
        return rtrn;
    }
}
