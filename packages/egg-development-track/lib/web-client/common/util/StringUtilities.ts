/**
 * Converts strings of the form 'one-two-three' to 'One-Two-Three', also called 'train-case'.
 */
export function trainCase(value: string): string {
    if (value) {
        let newValue = '';

        for (let i = 0; i < value.length; i++) {
            newValue += (i === 0 || value[i - 1] === '-')
                ? value[i].toUpperCase()
                : value[i];
        }

        return newValue;
    }

    return value;
}

export function roundWithFixedPoints(value: number, fixedPoints: number): number {
    if (fixedPoints < 0 || fixedPoints > 2) {
        throw new Error('Fixed points must be 0, 1, or 2.');
    }

    // NOTE: This attempts to do proper decimal-place rounding (see http://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-in-javascript).

    if (fixedPoints === 1) {
        return Math.round((value + 0.0001) * 10) / 10;
    }
    else if (fixedPoints === 2) {
        return Math.round((value + 0.00001) * 100) / 100;
    }

    return Math.round(value);
}

export function toStringWithFixedPoints(value: number, fixedPoints: number): string {
    if (fixedPoints < 0 || fixedPoints > 2) {
        throw new Error('Fixed points must be 0, 1, or 2.');
    }

    let roundedValue = roundWithFixedPoints(value, fixedPoints);

    return roundedValue.toFixed(fixedPoints);
}



// WEBPACK FOOTER //
// ./src/client/common/util/StringUtilities.ts