/**
 * EngineResult — Standardized result type for all engine/service operations.
 *
 * AKITA-410: Every service method that can succeed or fail MUST return an EngineResult.
 *
 * Convention:
 *   - `success: true|false` — always present.
 *   - `msg: string` — always present. Human-readable PT-BR message for the UI.
 *   - Additional fields are allowed (e.g. `accepted`, `ratio`, `events`, `players`).
 *
 * Usage:
 *   import { ok, fail } from '../engine/EngineResult.js';
 *   return ok('Jogador contratado!');
 *   return ok('Vendido!', { playerId: 123 });
 *   return fail('Saldo insuficiente.');
 *   return fail('Jogador não encontrado.', { accepted: false });
 *
 * @typedef {Object} EngineResult
 * @property {boolean} success
 * @property {string} msg
 */

/**
 * Creates a success result.
 * @param {string} [msg='OK'] — Human-readable message.
 * @param {object} [extra] — Additional fields merged into the result.
 * @returns {EngineResult}
 */
export function ok(msg = 'OK', extra = {}) {
    return { success: true, msg, ...extra };
}

/**
 * Creates a failure result.
 * @param {string} [msg='Erro desconhecido.'] — Human-readable message.
 * @param {object} [extra] — Additional fields merged into the result.
 * @returns {EngineResult}
 */
export function fail(msg = 'Erro desconhecido.', extra = {}) {
    return { success: false, msg, ...extra };
}
