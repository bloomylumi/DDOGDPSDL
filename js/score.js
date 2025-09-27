/**
 * Number of decimal digits to round to
 */
const scale = 2;

/** Curve parameters */
const maxPoints = 350;          // Maximum score at rank 1
const minBase = 20;             // Minimum score at rank 151 (change this!)
const maxRank = 151;            // Rank at which the base score reaches minBase
const decayExp = 0.4;           // Curve exponent
// Coefficient so that base(maxRank) = minBase
const decayCoeff = (minBase - maxPoints) / Math.pow(maxRank - 1, decayExp);

/**
 * Calculate the score awarded for a given rank and completion percentage
 * @param {Number} rank Position in the list
 * @param {Number} percent Percentage of completion
 * @param {Number} minPercent Minimum percentage required
 * @returns {Number} Final score
 */
export function score(rank, percent, minPercent) {
    // Beyond the maximum rank, return the minimum score
    if (rank >= maxRank) {
        return minBase;
    }

    // From rank 76+, only 100% completions count
    if (rank > 75 && percent < 100) {
        return 0;
    }

    // Base curve: maxPoints at rank=1, minBase at rank=maxRank
    const base = decayCoeff * Math.pow(rank - 1, decayExp) + maxPoints;

    // Normalize percent completion between 0 and 1
    const norm = (percent - (minPercent - 1)) / (100 - (minPercent - 1));

    // Raw score (never less than minBase)
    let s = Math.max(minBase, base) * norm;

    // Apply penalty if not 100%
    if (percent !== 100) {
        return round(s - s / 3);
    }

    return Math.max(round(s), minBase);
}

/**
 * Round a number to the given decimal scale
 * @param {Number} num
 * @returns {Number}
 */
export function round(num) {
    if (!('' + num).includes('e')) {
        return +(Math.round(num + 'e+' + scale) + 'e-' + scale);
    } else {
        const arr = ('' + num).split('e');
        let sign = '';
        if (+arr[1] + scale > 0) {
            sign = '+';
        }
        return +(
            Math.round(+arr[0] + 'e' + sign + (+arr[1] + scale)) +
            'e-' +
            scale
        );
    }
}
