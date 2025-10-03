/**
 * Number of decimal digits to round to
 */
const scale = 2;

/** Scoring shape parameters */
const maxPoints = 400;   // Score at rank 1 (Top 1)
const minBase   = 30;     // Asymptotic minimum near worst rank
const maxRank   = 151;   // Cutoff rank (anything >= this rank gives 0 points)

const topBoundary = 15;
const fractionAtTopBoundary = 0.75; 
const tailFractionAtEnd     = 0.01;

/**
 * Calculate the score (numeric only).
 * @returns {Number} Always a number (0 if rank >= 151)
 */
export function score(rank, percent, minPercent) {
    // If rank is outside the scoring range, return 0
    if (rank >= maxRank) {
        return 0;
    }

    // From rank 76+, only 100% counts
    if (rank > 75 && percent < 100) {
        return 0;
    }

    // Clamp rank to [1, maxRank-1]
    rank = Math.max(1, Math.min(rank, maxRank - 1));

    const base = baseScore(rank);

    // Normalize percent
    let norm = (percent - (minPercent - 1)) / (100 - (minPercent - 1));
    norm = Math.max(0, Math.min(1, norm));

    let s = base * norm;

    if (percent !== 100) {
        s = s - s / 3;
    }

    return Math.max(round(s), 0);
}

/**
 * Two-phase exponential decay for the base:
 * f(1) = 1
 * f(topBoundary) = fractionAtTopBoundary
 * f(maxRank-1) = tailFractionAtEnd
 */
function baseScore(rank) {
    const r0 = Math.max(2, Math.min(topBoundary, maxRank - 1));
    const spanTop  = r0 - 1;
    const spanTail = (maxRank - 1) - r0;

    const fracTop = clamp01(fractionAtTopBoundary);
    const lambdaTop = -Math.log(Math.max(fracTop, 1e-9)) / Math.max(spanTop, 1);
    const f_r0 = Math.exp(-lambdaTop * spanTop);

    const fracTailEnd = clamp01(tailFractionAtEnd);
    const lambdaTail = (Math.log(f_r0) - Math.log(Math.max(fracTailEnd, 1e-12))) / Math.max(spanTail, 1);

    let frac;
    if (rank <= r0) {
        frac = Math.exp(-lambdaTop * (rank - 1));
    } else {
        frac = f_r0 * Math.exp(-lambdaTail * (rank - r0));
    }

    return minBase + (maxPoints - minBase) * frac;
}

function clamp01(x) {
    return Math.max(0, Math.min(1, x));
}

/** Round helper */
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
