/**
 * Telemetry Utils — helpers compartilhados pelos detectores.
 *
 * Funções puras. Sem side effects.
 */

export function clamp(value, min = 0, max = 100) {
    if (!isFinite(value)) return min;
    return Math.max(min, Math.min(max, value));
}

export function avg(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((s, v) => s + (Number(v) || 0), 0) / arr.length;
}

export function variance(arr) {
    if (!arr || arr.length < 2) return 0;
    const m = avg(arr);
    return arr.reduce((s, v) => s + Math.pow((Number(v) || 0) - m, 2), 0) / arr.length;
}

export function stdDev(arr) {
    return Math.sqrt(variance(arr));
}

export function percentile(arr, p) {
    if (!arr || arr.length === 0) return 0;
    const sorted = [...arr].map(Number).filter(v => isFinite(v)).sort((a, b) => a - b);
    if (sorted.length === 0) return 0;
    const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
    return sorted[idx];
}

/**
 * Build detector result with consistent shape.
 */
export function buildResult(spec, name, score, signals = [], extra = {}) {
    const sigs = (signals || []).filter(s => s && s.severity > 0);
    sigs.sort((a, b) => (b.severity || 0) - (a.severity || 0));
    return {
        spec,
        name,
        score: clamp(Math.round(score)),
        signals: sigs,
        topSignal: sigs[0]?.id || null,
        ...extra
    };
}

/**
 * Wrap a detector so any throw becomes a graceful score=0 + STATE_INVALID signal.
 */
export function safeDetect(spec, name, fn) {
    return function detect(state) {
        try {
            const start = performance.now();
            const res = fn(state || {});
            const elapsed = performance.now() - start;
            if (elapsed > 10) {
                // Non-fatal: log but still return
                if (typeof console !== 'undefined') {
                    console.warn(`[Telemetry ${spec}] slow detector: ${elapsed.toFixed(1)}ms`);
                }
            }
            res._elapsedMs = elapsed;
            return res;
        } catch (err) {
            return buildResult(spec, name, 0, [{
                id: 'STATE_INVALID',
                severity: 1,
                msg: `Detector falhou: ${err.message}`
            }]);
        }
    };
}

/**
 * Gini coefficient — measures concentration (0 = perfect equality, 1 = full concentration).
 */
export function gini(values) {
    if (!values || values.length < 2) return 0;
    const arr = values.map(Number).filter(v => isFinite(v) && v >= 0).sort((a, b) => a - b);
    const n = arr.length;
    if (n === 0) return 0;
    const total = arr.reduce((s, v) => s + v, 0);
    if (total === 0) return 0;
    let sumNumerator = 0;
    for (let i = 0; i < n; i++) {
        sumNumerator += (2 * (i + 1) - n - 1) * arr[i];
    }
    return clamp(sumNumerator / (n * total), 0, 1);
}
