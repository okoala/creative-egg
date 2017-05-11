'use strict';

export interface IValueChangedCallback {
    (name: string, oldValue: boolean | string | number, newValue: boolean | string | number): void;
}

export interface IConfigSettings {

    /**
     * get the value of the given property name
     */
    get(name: string, defaultVal?);

    /**
     *  return the value for the specified property as a boolean, or defaultVal if this property doesn't exist.
     */
    getBoolean(name: string, defaultVal?: boolean): boolean;

    /*
     *  set a new value for the given prooperty name.  Will override any existing values. 
     */
    set(name: string, value: string | boolean | number): void;

    /*
     *  register given callback for when a config settings value changes
     */
    onValueChanged(cb: IValueChangedCallback): void;
}
