/**
 * Exporter — AutoPlayLab F1
 *
 * Converte results pra CSV/JSON downloadable.
 */

/**
 * CSV de batch results (1 linha por save).
 *
 * @param {Array} results
 * @param {string[]} [fields]
 * @returns {string}
 */
export function toCSV(results, fields = null) {
    if (!Array.isArray(results) || results.length === 0) return '';

    // Detect fields if not given
    let cols = fields;
    if (!cols) {
        const sample = results.find(r => r.snapshot)?.snapshot;
        cols = sample ? Object.keys(sample).filter(k => typeof sample[k] !== 'object') : [];
    }

    const lines = [['seed', 'weeksCompleted', 'crash', ...cols].join(',')];
    for (const r of results) {
        const row = [
            r.seed,
            r.weeksCompleted || 0,
            r.crash ? `"${(r.crash.message || '').replace(/"/g, "'")}"` : '',
            ...cols.map(c => r.snapshot?.[c] ?? ''),
        ];
        lines.push(row.join(','));
    }
    return lines.join('\n');
}

/**
 * JSON serializável (pretty).
 */
export function toJSON(results) {
    return JSON.stringify(results, null, 2);
}

/**
 * Download helper pra browser. Cria <a href> + click.
 */
export function downloadFile(filename, content, mime = 'text/csv;charset=utf-8') {
    if (typeof document === 'undefined') return false;
    try {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Filename helper por preset + timestamp.
 */
export function timestampedFilename(presetId, extension = 'csv') {
    const d = new Date();
    const ts = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
    return `autoplay-${presetId}-${ts}.${extension}`;
}
