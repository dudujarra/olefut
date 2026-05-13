/**
 * DiffEngine — AutoPlayLab F1
 *
 * Compara batches A/B. Útil pra regression check + balance validation.
 */

/**
 * Estatística básica: avg, median, stddev de array de snapshots por field.
 */
export function aggregateStat(results, field) {
    const values = results
        .map(r => r.snapshot?.[field])
        .filter(v => typeof v === 'number');
    if (values.length === 0) return { count: 0, avg: 0, median: 0, min: 0, max: 0, stddev: 0 };
    const sorted = [...values].sort((a, b) => a - b);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const variance = values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length;
    return {
        count: values.length,
        avg: Number(avg.toFixed(2)),
        median,
        min,
        max,
        stddev: Number(Math.sqrt(variance).toFixed(2)),
    };
}

/**
 * Compara dois batches em fields chave.
 *
 * @param {Array} batchA
 * @param {Array} batchB
 * @param {string[]} fields
 * @returns {object} {fieldName: {a: stat, b: stat, deltaAvg, deltaPercent}}
 */
export function diffBatches(batchA, batchB, fields = ['wins', 'losses', 'finalPosition']) {
    const diff = {};
    for (const f of fields) {
        const a = aggregateStat(batchA, f);
        const b = aggregateStat(batchB, f);
        const deltaAvg = Number((b.avg - a.avg).toFixed(2));
        const deltaPercent = a.avg !== 0 ? Number(((deltaAvg / a.avg) * 100).toFixed(2)) : 0;
        const significantDelta = Math.abs(deltaPercent) > 5; // >5% = digno de atenção
        diff[f] = { a, b, deltaAvg, deltaPercent, significantDelta };
    }
    return diff;
}

/**
 * Histograma de valores em buckets.
 */
export function histogram(results, field, bucketSize = 1) {
    const values = results.map(r => r.snapshot?.[field]).filter(v => typeof v === 'number');
    const buckets = {};
    for (const v of values) {
        const k = Math.floor(v / bucketSize) * bucketSize;
        buckets[k] = (buckets[k] || 0) + 1;
    }
    return buckets;
}

/**
 * Filter crashes do batch.
 */
export function extractCrashes(results) {
    return results.filter(r => r.crash);
}

/**
 * Agrupa crashes por stack signature (primeiras 2 linhas).
 */
export function groupCrashesByStack(crashes) {
    const groups = {};
    for (const c of crashes) {
        const sig = (c.crash?.stack || c.crash?.message || 'unknown').split('\n').slice(0, 2).join('\n');
        if (!groups[sig]) groups[sig] = { signature: sig, count: 0, seeds: [], firstWeek: null };
        groups[sig].count++;
        groups[sig].seeds.push(c.seed);
        if (groups[sig].firstWeek === null) groups[sig].firstWeek = c.crash?.week;
    }
    return Object.values(groups).sort((a, b) => b.count - a.count);
}
