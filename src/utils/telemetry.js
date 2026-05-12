/**
 * Telemetry — SPEC-F6.1
 *
 * Sistema opt-in local-only de eventos pra entender uso real do jogo.
 * Zero envio externo. Apenas localStorage agregado.
 *
 * Pure module via storage I/O. Headless.
 */

const STORAGE_KEY = 'elifoot_telemetry';
const OPT_IN_KEY = 'elifoot_telemetry_opt_in';
const MAX_EVENTS = 1000;

/**
 * Verifica se user optou por telemetria.
 *
 * @returns {boolean}
 */
export function isOptedIn() {
    if (typeof localStorage === 'undefined') return false;
    try {
        return localStorage.getItem(OPT_IN_KEY) === 'true';
    } catch {
        return false;
    }
}

/**
 * Define opt-in (true/false). Reseta dados se opt-out.
 *
 * @param {boolean} value
 */
export function setOptIn(value) {
    if (typeof localStorage === 'undefined') return;
    try {
        if (value === true) {
            localStorage.setItem(OPT_IN_KEY, 'true');
        } else {
            localStorage.setItem(OPT_IN_KEY, 'false');
            localStorage.removeItem(STORAGE_KEY); // clear data on opt-out
        }
    } catch { /* noop */ }
}

/**
 * Registra evento. No-op se opt-out.
 *
 * @param {string} type — event type (snake_case)
 * @param {object} [payload] — small data object
 */
export function event(type, payload = {}) {
    if (!isOptedIn()) return;
    if (typeof type !== 'string' || !type) return;
    if (typeof localStorage === 'undefined') return;
    try {
        const raw = localStorage.getItem(STORAGE_KEY) || '[]';
        const events = JSON.parse(raw);
        if (!Array.isArray(events)) return;
        events.push({
            type,
            payload: typeof payload === 'object' ? payload : {},
            ts: Date.now(),
        });
        // FIFO cap
        while (events.length > MAX_EVENTS) events.shift();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch { /* noop */ }
}

/**
 * Retorna events agregados por type (count).
 *
 * @returns {object} — { type: count, ... }
 */
export function aggregate() {
    if (!isOptedIn()) return {};
    if (typeof localStorage === 'undefined') return {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY) || '[]';
        const events = JSON.parse(raw);
        if (!Array.isArray(events)) return {};
        return events.reduce((acc, e) => {
            acc[e.type] = (acc[e.type] || 0) + 1;
            return acc;
        }, {});
    } catch {
        return {};
    }
}

/**
 * Export raw events (debug).
 *
 * @returns {Array}
 */
export function getRawEvents() {
    if (!isOptedIn()) return [];
    if (typeof localStorage === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY) || '[]';
        const events = JSON.parse(raw);
        return Array.isArray(events) ? events : [];
    } catch {
        return [];
    }
}

/**
 * Reset todos eventos mas mantém opt-in setting.
 */
export function reset() {
    if (typeof localStorage === 'undefined') return;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
}

export { STORAGE_KEY, OPT_IN_KEY, MAX_EVENTS };
