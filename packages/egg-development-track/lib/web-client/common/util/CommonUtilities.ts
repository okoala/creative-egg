export function isArray(a) {
    return (!!a) && (a.constructor === Array);
};

export function isObject(a) {
    return (!!a) && (a.constructor === Object);
};

export function isObjectEmpty(a) {
    return !isObject(a) || Object.keys(a).length === 0;
}

export function getNamesForEnum(t: Object): string[] {
    const values = Object.keys(t).map(k => t[k]);
    const names = values.filter(v => typeof v === 'string') as string[];
    return names;
}

export function getIntegersForEnum(t: Object): number[] {
    const values = Object.keys(t).map(k => t[k]);
    const numbers = values.filter(v => typeof v === 'number') as number[];
    return numbers;
}



// WEBPACK FOOTER //
// ./src/client/common/util/CommonUtilities.ts