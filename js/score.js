/**
 * Number of decimal digits to round to
 */
const scale = 2;

/** Scoring shape parameters (tune these) */
const maxPoints = 350;   // Score at rank 1 (Top 1)
const minBase   = 0;     // Asymptotic minimum near worst rank
const maxRank   = 151;   // Worst rank (Top 151)

/**
 * Exponential shape control:
 * - fractionAtTopBoundary: remaining fraction at rank = topBoundary (how flat Top 1..topBoundary is)
 *      LOWER = harsher; e.g. 0.90 is harsher than 0.95
 * - tailFractionAtEnd: remaining fraction at rank = maxRank (how high the tail stays)
 */
const topBoundary = 10;
const fractionAtTopBoundary = 0.90; // <— harsher Top 10 (was 0.95)
const tailFractionAtEnd     = 0.01;

/**
 * Calculate the score awarded for a given rank and completion percentage
 * @param {Number} rank Position in the list (1 = best, maxRank = worst)
 * @param {Number} percent Percentage of completion
 * @param {Number} minPercent Minimum percentage required
 * @returns {Number} Final score
 */
export function score(rank, percent, minPercent) {
    // Clamp rank
    rank = Math.max(1, Math.min(rank, maxRank));

    // Keep your original rule: from rank 76+, only 100% counts
    if (rank > 75 && percent < 100) {
        return 0;
    }

    // --- Base score with two-phase exponential (harsher in Top 10) ---
    const base = baseScore(rank);

    // --- Normalize percent (0..1) against minPercent ---
    let norm = (percent - (minPercent - 1)) / (100 - (minPercent - 1));
    norm = Math.max(0, Math.min(1, norm));

    // Raw score
    let s = base * norm;

    // Same non-100% penalty as your original code
    if (percent !== 100) {
        s = s - s / 3; // reduce by ~33%
    }

    return Math.max(round(s), 0);
}

/**
 * Two-phase exponential decay for the base:
 * f(1) = 1
 * f(topBoundary) = fractionAtTopBoundary
 * f(maxRank) = tailFractionAtEnd
 */
function baseScore(rank) {
    const r0 = Math.max(2, Math.min(topBoundary, maxRank - 1)); // boundary rank (>=2)
    const spanTop  = r0 - 1;           // steps from rank 1 to r0
    const spanTail = maxRank - r0;     // steps from r0 to maxRank

    // Solve lambda for the Top phase so that f(r0) hits fractionAtTopBoundary
    const fracTop = clamp01(fractionAtTopBoundary);
    const lambdaTop = -Math.log(Math.max(fracTop, 1e-9)) / Math.max(spanTop, 1);

    // Continuity at r0
    const f_r0 = Math.exp(-lambdaTop * spanTop);

    // Solve lambda for the Tail so that f(maxRank) hits tailFractionAtEnd
    const fracTailEnd = clamp01(tailFractionAtEnd);
    const lambdaTail = (Math.log(f_r0) - Math.log(Math.max(fracTailEnd, 1e-12))) / Math.max(spanTail, 1);

    // Compute f(rank)
    let frac;
    if (rank <= r0) {
        frac = Math.exp(-lambdaTop * (rank - 1));
    } else {
        frac = f_r0 * Math.exp(-lambdaTail * (rank - r0));
    }

    // Convert fraction to absolute base score
    const base = minBase + (maxPoints - minBase) * frac;
    return Math.max(minBase, Math.min(base, maxPoints));
}

function clamp01(x) {
    return Math.max(0, Math.min(1, x));
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
