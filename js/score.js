/**
 * Number of decimal digits to round to
 */
const scale = 2;

/** Curve parameters (tweak as you like) */
const maxPoints = 350;          // Maximum score at the highest rank (151)
const minBase  = 0;             // Minimum base score at rank 1
const maxRank  = 151;           // Highest rank
const shapeExp = 2.0;           // >1 makes low ranks much smaller and high ranks much larger (convex)

/**
 * Percent bias:
 * - At low ranks, exponent > 1 reduces the value of partial completion
 * - At high ranks, exponent < 1 increases the value of partial completion
 *
 * Example: 1.3 (penalize partial % at low ranks) --> 0.8 (favor partial % at high ranks)
 */
const percentBiasLow  = 1.3;    // exponent at rank 1
const percentBiasHigh = 0.8;    // exponent at rank 151

/**
 * Calculate the score awarded for a given rank and completion percentage
 * @param {Number} rank Position (higher rank number = better)
 * @param {Number} percent Percentage of completion (0..100)
 * @param {Number} minPercent Minimum percentage required
 * @returns {Number} Final score
 */
export function score(rank, percent, minPercent) {
    // Clamp rank to [1, maxRank]
    rank = Math.max(1, Math.min(rank, maxRank));

    // --- Base score grows with rank (convex) ---
    // t goes from 0 at rank=1 to 1 at rank=maxRank
    const t = (rank - 1) / (maxRank - 1);
    // Base increases from minBase -> maxPoints with a convex shape (shapeExp > 1)
    const base = minBase + (maxPoints - minBase) * Math.pow(t, shapeExp);

    // --- Normalize percent (0..1) against minPercent ---
    let norm = (percent - (minPercent - 1)) / (100 - (minPercent - 1));
    norm = Math.max(0, Math.min(1, norm));

    // --- Bias percent by rank: penalize low ranks, favor high ranks ---
    const percentExp = lerp(percentBiasLow, percentBiasHigh, t);
    const biasedPercent = Math.pow(norm, percentExp);

    // --- Raw score ---
    let s = base * biasedPercent;

    // Optional: keep the original “non-100% penalty”
    if (percent !== 100) {
        s = s - s / 3; // reduce by 33%
    }

    return Math.max(round(s), 0);
}

/** Linear interpolation helper */
function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Round a number to the given decimal scale
 * (kept from your original code)
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
