/**
 * EngineLogger — Telemetria de Erros da Engine
 *
 * Substitui os blocos catch vazios por captura estruturada.
 * Nunca lança exceção, nunca quebra o fluxo.
 * Mantém um ring buffer de erros para auditoria pós-mortem.
 *
 * Uso:
 *   import { EngineLogger } from './EngineLogger.js';
 *   try { ... } catch (err) { EngineLogger.capture(err, 'SeasonProcessor._processLegacy'); }
 */

const MAX_ERRORS = 50;
const MAX_WARNINGS = 100;

class _EngineLogger {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this._totalErrorCount = 0;
        this._totalWarningCount = 0;
    }

    /**
     * Captura um erro sem jamais relançar.
     * @param {Error|string} err
     * @param {string} context — ex: 'SeasonProcessor._processLegacy'
     * @param {object} [meta] — dados extras (season, week, teamId, etc.)
     */
    capture(err, context, meta = {}) {
        this._totalErrorCount++;
        const entry = {
            ts: Date.now(),
            context,
            message: err?.message || String(err),
            stack: err?.stack?.split('\n').slice(0, 4).join('\n') || null,
            meta,
        };

        this.errors.push(entry);
        if (this.errors.length > MAX_ERRORS) this.errors.shift();

        // Em dev, emitir no stderr para não poluir stdout do vitest
        if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
            console.warn(`[EngineLogger] ${context}: ${entry.message}`);
        }
    }

    /**
     * Captura um warning (não-fatal, mas suspeito).
     * @param {string} message
     * @param {string} context
     * @param {object} [meta]
     */
    warn(message, context, meta = {}) {
        this._totalWarningCount++;
        const entry = {
            ts: Date.now(),
            context,
            message,
            meta,
        };

        this.warnings.push(entry);
        if (this.warnings.length > MAX_WARNINGS) this.warnings.shift();
    }

    /**
     * Retorna snapshot de saúde para dashboards / testes.
     */
    getHealthReport() {
        return {
            totalErrors: this._totalErrorCount,
            totalWarnings: this._totalWarningCount,
            recentErrors: this.errors.slice(-10),
            recentWarnings: this.warnings.slice(-10),
            healthy: this._totalErrorCount === 0,
        };
    }

    /**
     * Reseta contadores (para início de soak test).
     */
    reset() {
        this.errors = [];
        this.warnings = [];
        this._totalErrorCount = 0;
        this._totalWarningCount = 0;
    }
}

// Singleton — toda a engine compartilha a mesma instância
export const EngineLogger = new _EngineLogger();
