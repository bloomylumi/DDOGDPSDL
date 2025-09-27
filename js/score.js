/**
 * Number of decimal digits to round to
 */
const scale = 2;

/** Curve parameters */
const maxPoints = 350;          // Maximum score at rank 1 (Top 1)
const minBase   = 0;            // Minimum score at rank maxRank
const maxRank   = 151;          // Lowest rank
const shapeExp  = 1.2;          // Shape exponent (tune: >1 steep drop, <1 smoother)

/**
 * Calculate the score awarded for a given rank and completion percentage
 * @param {Number} rank Position in the list (1 = best, maxRank = worst)
 * @param {Number} percent Percentage of completion
 * @param {Number} minPercent Minimum percentage required
 * @returns {Number} Final score
 */
export function score(rank, percent, minPercent) {
    // Clamp rank to [1, maxRank]
    rank = Math.max(1, Math.min(rank, maxRank));

    // --- Base score decreases with rank ---
    // u goes from 1 at rank=1 to 0 at rank=maxRank
    const u = 1 - (rank - 1) / (maxRank - 1);
    // Base = maxPoints at rank=1, minBase at rank=maxRank
    const base = minBase + (maxPoints - minBase) * Math.pow(u, shapeExp);

    // --- Normalize percentage ---
    let norm = (percent - (minPercent - 1)) / (100 - (minPercent - 1));
    norm = Math.max(0, Math.min(1, norm));

    // --- Apply percent ---
    let s = base * norm;

    // Apply penalty if not 100%
    if (percent !== 100) {
        s = s - s / 3;
    }

    return Math.max(round(s), 0);
}

/**
 * Round a number to the given decimal scale
 */
export function round(num) {
    if (!('' + num).includes('e')) {
        return +(Math.round(num + 'e+' + scale) + 'e-' + scale);
    } else {
        const arr = ('' + num).split('e');
        let sign = '';
        if (+arr[1] + scale > 0) sign = '+';
        return +(
            Math.round(+arr[0] + 'e' + sign + (+arr[1] + scale)) +
            'e-' +
            scale
        );
    }
}
