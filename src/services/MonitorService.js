import { rng as systemRng } from '../engine/rng.js';
/**
 * MonitorService — v1.6
 *
 * Captura runtime + gameplay events pra auxiliar Dudu lembrar experiência.
 *
 * 4 categorias:
 * - bug: erros JS (window.onerror, unhandledrejection, ErrorBoundary)
 * - gameplay: decisões, partidas, transferências, conquistas
 * - feedback: relato manual via FloatingBugButton
 * - note: observação livre user
 *
 * Storage: localStorage 'olefut_monitor' separado do save game.
 * Cap: 500 entries (FIFO descarte oldest).
 * Export: JSON download.
 */

const STORAGE_KEY = 'olefut_monitor';
const MAX_ENTRIES = 500;

const CATEGORIES = Object.freeze({
    BUG: 'bug',
    GAMEPLAY: 'gameplay',
    FEEDBACK: 'feedback',
    NOTE: 'note'
});

const SEVERITIES = Object.freeze({
    CRITICAL: 'critical',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
});

let _entries = null;
let _instance = null;

function loadEntries() {
    if (_entries !== null) return _entries;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        _entries = raw ? JSON.parse(raw) : [];
    } catch {
        _entries = [];
    }
    return _entries;
}

function saveEntries() {
    try {
        // FIFO cap
        if (_entries.length > MAX_ENTRIES) {
            _entries = _entries.slice(-MAX_ENTRIES);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(_entries));
    } catch (e) {
        console.warn('[Monitor] Failed to persist:', e);
    }
}

function nextId() {
    return `mon_${Date.now()}_${systemRng().toString(36).slice(2, 8)}`;
}

export class MonitorService {
    constructor() {
        this._installed = false;
    }

    /**
     * Singleton accessor (safe global).
     */
    static getInstance() {
        if (!_instance) _instance = new MonitorService();
        return _instance;
    }

    /**
     * Install global handlers (window.onerror + unhandledrejection + console patches).
     * Idempotente.
     */
    install() {
        if (this._installed) return;
        if (typeof window === 'undefined') return;
        this._installed = true;

        const self = this;
        window.addEventListener('error', (event) => {
            self.recordBug({
                severity: SEVERITIES.ERROR,
                message: event.message || 'Unknown error',
                stack: event.error?.stack,
                source: event.filename,
                line: event.lineno,
                col: event.colno
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            self.recordBug({
                severity: SEVERITIES.ERROR,
                message: 'Unhandled promise rejection',
                stack: event.reason?.stack,
                reason: String(event.reason)
            });
        });

        // Patch console.error + console.warn (auto-capture sem user action)
        const origError = console.error;
        const origWarn = console.warn;
        console.error = function (...args) {
            self.record(CATEGORIES.BUG, {
                severity: SEVERITIES.ERROR,
                message: args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' '),
                source: 'console.error'
            });
            origError.apply(console, args);
        };
        console.warn = function (...args) {
            self.record(CATEGORIES.BUG, {
                severity: SEVERITIES.WARNING,
                message: args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' '),
                source: 'console.warn'
            });
            origWarn.apply(console, args);
        };

        // Performance metrics every 60s
        if (typeof window.setInterval === 'function') {
            this._perfInterval = window.setInterval(() => {
                try {
                    const mem = performance?.memory;
                    if (mem) {
                        self.record(CATEGORIES.GAMEPLAY, {
                            severity: SEVERITIES.INFO,
                            action: 'PERF_SNAPSHOT',
                            ctx: {
                                jsHeapMB: Math.round(mem.usedJSHeapSize / 1024 / 1024),
                                jsHeapLimitMB: Math.round(mem.jsHeapSizeLimit / 1024 / 1024)
                            }
                        });
                    }
                } catch { /* ignore */ }
            }, 60000);
        }

        self.recordGameplay('SESSION_START', {
            url: window.location.href,
            ua: navigator.userAgent.slice(0, 100),
            screen: `${window.innerWidth}x${window.innerHeight}`
        });
    }

    /**
     * Auto-instrument engine methods. Wraps key methods to log calls.
     * Call após createEngine() (idempotente).
     */
    instrumentEngine(engine) {
        if (!engine || engine._monitorInstrumented) return;
        engine._monitorInstrumented = true;

        const self = this;
        const TRACKED_METHODS = [
            'advanceWeek',
            'playMatch',
            'setTactic',
            'setFormation',
            'doTraining',
            'doTeamTalk',
            'buyPlayer',
            'sellPlayer',
            'acceptTransferOffer',
            'rejectTransferOffer',
            'upgradeAcademy',
            'upgradeStadium',
            'hireStaff',
            'fireStaff',
            'doScouting',
            'signScoutedPlayer',
            'renewContract',
            'applyLiveSubstitution',
            'saveFormationLayout'
        ];

        for (const methodName of TRACKED_METHODS) {
            const original = engine[methodName];
            if (typeof original !== 'function') continue;
            engine[methodName] = function (...args) {
                const start = performance.now();
                try {
                    const result = original.apply(this, args);
                    const elapsed = Math.round(performance.now() - start);
                    self.recordGameplay(`ENGINE.${methodName}`, {
                        args: args.map(a => self._summarizeArg(a)).slice(0, 3),
                        elapsedMs: elapsed,
                        currentWeek: this.currentWeek
                    });
                    return result;
                } catch (e) {
                    self.recordBug({
                        severity: SEVERITIES.ERROR,
                        message: `engine.${methodName} threw: ${e.message}`,
                        stack: e.stack,
                        method: methodName,
                        args: args.map(a => self._summarizeArg(a))
                    });
                    throw e;
                }
            };
        }

        self.recordGameplay('ENGINE_INSTRUMENTED', {
            methods: TRACKED_METHODS.length
        });
    }

    /**
     * Summarize arg pra log (avoid bloat).
     */
    _summarizeArg(arg) {
        if (arg === null || arg === undefined) return null;
        if (typeof arg === 'number' || typeof arg === 'string' || typeof arg === 'boolean') return arg;
        if (Array.isArray(arg)) return `[Array(${arg.length})]`;
        if (typeof arg === 'object') {
            // Show known shape ids
            if (arg.id != null) return `{id:${arg.id}}`;
            return `{${Object.keys(arg).slice(0, 3).join(',')}}`;
        }
        return typeof arg;
    }

    /**
     * Add entry generic.
     */
    record(category, payload = {}) {
        loadEntries();
        const entry = {
            id: nextId(),
            ts: Date.now(),
            category,
            severity: payload.severity || SEVERITIES.INFO,
            ...payload
        };
        _entries.push(entry);
        saveEntries();
        return entry;
    }

    recordBug(payload) {
        return this.record(CATEGORIES.BUG, { severity: SEVERITIES.ERROR, ...payload });
    }

    recordGameplay(action, ctx = {}) {
        return this.record(CATEGORIES.GAMEPLAY, {
            severity: SEVERITIES.INFO,
            action,
            ctx
        });
    }

    recordFeedback(message, screenshot = null) {
        return this.record(CATEGORIES.FEEDBACK, {
            severity: SEVERITIES.WARNING,
            message,
            screenshot,
            url: typeof window !== 'undefined' ? window.location.href : null
        });
    }

    recordNote(text) {
        return this.record(CATEGORIES.NOTE, { severity: SEVERITIES.INFO, text });
    }

    /**
     * Returns all entries (sorted desc by ts).
     */
    getAll() {
        loadEntries();
        return [..._entries].sort((a, b) => b.ts - a.ts);
    }

    /**
     * Filter by category.
     */
    getByCategory(category) {
        return this.getAll().filter(e => e.category === category);
    }

    /**
     * Stats summary.
     */
    getStats() {
        const all = this.getAll();
        const stats = {
            total: all.length,
            bugs: 0,
            gameplay: 0,
            feedback: 0,
            notes: 0,
            firstEntry: all[all.length - 1]?.ts || null,
            lastEntry: all[0]?.ts || null
        };
        for (const e of all) {
            if (e.category === CATEGORIES.BUG) stats.bugs++;
            else if (e.category === CATEGORIES.GAMEPLAY) stats.gameplay++;
            else if (e.category === CATEGORIES.FEEDBACK) stats.feedback++;
            else if (e.category === CATEGORIES.NOTE) stats.notes++;
        }
        return stats;
    }

    /**
     * Clear all entries.
     */
    clear() {
        _entries = [];
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // ignore
        }
    }

    /**
     * Export as JSON string.
     */
    exportJSON() {
        return JSON.stringify(this.getAll(), null, 2);
    }
}

export { CATEGORIES, SEVERITIES, MAX_ENTRIES };
