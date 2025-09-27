/**
 * Number of decimal digits to round to
 */
const scale = 2;

/** Scoring shape parameters (tune these) */
const maxPoints = 350;      // Score at ranks 1..plateauTop
const minBase   = 0;        // Minimum base score near the worst rank
const maxRank   = 151;      // Worst rank
const plateauTop = 10;      // Ranks 1..plateauTop share the same max score

/**
 * Exponential segment control (from rank = plateauTop + 1 to maxRank)
 * - fractionAt11: base at rank 11 as a fraction of maxPoints (e.g., 0.95 = 95%)
 * - tailFractionAtEnd: how much of (baseAt11 - minBase) remains at maxRank (e.g., 0.01 = 1%)
 */
const fractionAt11     = 0.95;
const tailFractionAtEnd = 0.01;

/**
 * Calculate the score awarded for a given rank and completion percentage
 * @param {Number} rank Position in the list (1 = best, maxRank = worst)
 * @param {Number} percent Percentage of completion
 * @param {Number} minPercent Minimum percentage required
 * @returns {Number} Final score
 */
export function score(rank, percent, minPercent) {
    // Clamp
    rank = Math.max(1, Math.min(rank, maxRank));

    // Early exit: for very low completion at high ranks (keep your original rule)
    if (rank > 75 && percent < 100) {
        return 0;
    }

    // --- Base score shape ---
    const base = baseScore(rank);

    // --- Normalize percent (0..1) against minPercent ---
    let norm = (percent - (minPercent - 1)) / (100 - (minPercent - 1));
    norm = Math.max(0, Math.min(1, norm));

    // Raw score
    let s = base * norm;

    // Same penalty as your original code if not 100%
    if (percent !== 100) {
        s = s - s / 3; // reduce by 33%
    }

    return Math.max(round(s), 0);
}

/**
 * Base score function:
 * - Ranks 1..plateauTop: constant = maxPoints
 * - Ranks plateauTop+1..maxRank: exponential decay from ~maxPoints to ~minBase
 */
function baseScore(rank) {
    // Plateau zone (Top 1..plateauTop)
    if (rank <= plateauTop) {
        return maxPoints;
    }

    // Past the end, force minBase
    if (rank >= maxRank) {
        return minBase;
    }

    // Exponential zone: ranks r0..maxRank
    const r0 = plateauTop + 1;        // First rank where we start decaying (e.g., 11)
    const baseAt11 = maxPoints * fractionAt11;

    // Solve lambda so that at maxRank, remaining fraction = tailFractionAtEnd
    const span = maxRank - r0; // number of steps from r0 to maxRank
    const lambda = -Math.log(Math.max(tailFractionAtEnd, 1e-9)) / Math.max(span, 1);

    // Exponential decay from baseAt11 -> minBase
    const steps = rank - r0;
    const decayed = minBase + (baseAt11 - minBase) * Math.exp(-lambda * steps);

    // Clamp to [minBase, maxPoints]
    return Math.max(minBase, Math.min(decayed, maxPoints));
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
