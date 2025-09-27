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
 *      e.g. 0.95 => at rank 10 you still have ~95% of (maxPoints - minBase)
 * - tailFractionAtEnd: remaining fraction at rank = maxRank (how high the tail stays)
 *      e.g. 0.01 => at rank 151 you keep ~1% of the initial gap
 */
const topBoundary = 10;
const fractionAtTopBoundary = 0.95; // smoother Top 10
const tailFractionAtEnd     = 0.01; // steeper tail

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

    // --- Base score with two-phase exponential (slow in Top 10, faster after) ---
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
 * Let f(r) be the fraction of (maxPoints - minBase) at rank r.
 * Phase 1: ranks 1..topBoundary use a gentle (small lambda) exponential.
 * Phase 2: ranks topBoundary+1..maxRank use a steeper exponential, continuous at the boundary,
 *          and reaching 'tailFractionAtEnd' at maxRank.
 *
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

    // Continuity at r0: f(r0) is the starting value for the tail phase
    const f_r0 = Math.exp(-lambdaTop * spanTop); // = fractionAtTopBoundary (within rounding)

    // Solve lambda for the Tail so that f(maxRank) hits tailFractionAtEnd
    const fracTailEnd = clamp01(tailFractionAtEnd);
    const lambdaTail = (Math.log(f_r0) - Math.log(Math.max(fracTailEnd, 1e-12))) / Math.max(spanTail, 1);

    // Compute f(rank)
    let frac;
    if (rank <= r0) {
        // Top phase (gentle)
        frac = Math.exp(-lambdaTop * (rank - 1));
    } else {
        // Tail phase (steeper), continuous at r0
        frac = f_r0 * Math.exp(-lambdaTail * (rank - r0));
    }

    // Convert fraction to absolute base score
    const base = minBase + (maxPoints - minBase) * frac;

    // Clamp to avoid tiny floating errors
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
