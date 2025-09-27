/**
 * Numbers of decimal digits to round to
 */
const scale = 2;

/** points exponensial */
const maxPoints = 350;
const levelsToZero = 151;
const decayExp = 0.4;

const decayCoeff = -maxPoints / Math.pow(levelsToZero - 1, decayExp); // ≈ -47.1662708659

/**
 * Calculate the score awarded when having a certain percentage on a list level
 * @param {Number} rank Position on the list
 * @param {Number} percent Percentage of completion
 * @param {Number} minPercent Minimum percentage required
 * @returns {Number}
 */
export function score(rank, percent, minPercent) {
    if (rank >= levelsToZero) {
        return 0;
    }
    if (rank > 75 && percent < 100) {
        return 0;
    }
    // coefficent
    const base = decayCoeff * Math.pow(rank - 1, decayExp) + maxPoints;

    // percent
    const norm = (percent - (minPercent - 1)) / (100 - (minPercent - 1));

    // raw score (clippato a 0)
    let s = base * norm;
    s = Math.max(0, s);

    // if not 100%
    if (percent !== 100) {
        return round(s - s / 3);
    }

    return Math.max(round(s), 0);
}

export function round(num) {
    if (!('' + num).includes('e')) {
        return +(Math.round(num + 'e+' + scale) + 'e-' + scale);
    } else {
        var arr = ('' + num).split('e');
        var sig = '';
        if (+arr[1] + scale > 0) {
            sig = '+';
        }
        return +(
            Math.round(+arr[0] + 'e' + sig + (+arr[1] + scale)) +
            'e-' +
            scale
        );
    }
}
