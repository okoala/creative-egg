import forEach from 'lodash/forEach';

export function getValueAtKeyCaseInsensitive<T>(values: { [key: string]: T }, searchKey: string): T {
    const normalizedSearchKey = searchKey.toLowerCase();
    let foundValue = undefined;

    forEach(values, (value, key) => {
        if (key.toLowerCase() === normalizedSearchKey) {
            foundValue = value;
            return false;
        }
    });

    return foundValue;
}

export function getKeyCaseInsensitive<T>(values: { [key: string]: T }, searchKey: string): string {
    const normalizedSearchKey = searchKey.toLowerCase();
    let foundKey = undefined;

    forEach(values, (value, key) => {
        if (key.toLowerCase() === normalizedSearchKey) {
            foundKey = key;
            return false;
        }
    });

    return foundKey;
}

export function convertToObject(value: string): {} {
    try {
        return JSON.parse(value);
    } catch (e) {
        // nothing to do here
    }
}



// WEBPACK FOOTER //
// ./src/client/common/util/ObjectUtilities.ts