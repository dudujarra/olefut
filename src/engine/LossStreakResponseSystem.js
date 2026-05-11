/* eslint-disable no-unused-vars */
import { rng as systemRng } from './rng.js';
/**
 * LossStreakResponseSystem — SPEC-077: Resposta a Sequência de Derrotas
 *
 * Sequências de derrotas geram choices de gestão de crise para player,
 * resposta automática para NPCs.
 *
 * Partially stateful: rastreia streak por time.
 */

const MORALE_FLOOR = 5;

const NPC_RESPONSES = [
    { action: 'tactic_change', description: 'Time NPC muda tática para sair da crise.' },
    { action: 'emergency_training', description: 'Time NPC intensifica treinos.' },
    { action: 'star_benched', description: 'Time NPC banca estrela para reação.' },
];

const RESPONSE_OPTIONS = [
    { id: 'squad_meeting', label: 'Reunião de elenco', effect: { moraleDelta: +10, tensionDelta: 0 } },
    { id: 'intensive_training', label: 'Semana de treino intensivo', effect: { moraleDelta: +5, tensionDelta: 0 } },
    { id: 'change_tactic', label: 'Mudar tática radicalmente', effect: { moraleDelta: 0, tensionDelta: -5 } },
    { id: 'public_statement', label: 'Coletiva de imprensa positiva', effect: { moraleDelta: +8, tensionDelta: +5 } },
    { id: 'resign', label: 'Pedir demissão', effect: { moraleDelta: 0, tensionDelta: 0 } },
];

const _streaks = new Map(); // teamId → lossStreak count

/**
 * Avalia resposta necessária para sequência de derrotas.
 *
 * @param {object} opts
 * @param {number} [opts.teamId]
 * @param {number} [opts.managerId]
 * @param {number} [opts.streakLength]
 * @param {number} [opts.currentTension=50]
 * @param {number} [opts.squadMorale=50]
 * @param {boolean} [opts.isPlayerManager=true]
 * @param {number} [opts.week=1]
 * @returns {object} avaliação completa
 */
export function evaluate({ teamId = 0, managerId = 0, streakLength = 0, currentTension = 50, squadMorale = 50, isPlayerManager = true, week = 1 } = {}) {
    const severity = computeSeverity(streakLength);
    const forcedEvent = isPlayerManager && streakLength >= 8;

    // Morale floor enforcement
    const moraleFloorApplied = squadMorale < MORALE_FLOOR;
    const newMorale = Math.max(MORALE_FLOOR, squadMorale);

    // Tension penalty for collapse
    let tensionApplied = null;
    if (streakLength >= 11) {
        tensionApplied = -40;
    }

    if (!isPlayerManager) {
        const npcResponse = NPC_RESPONSES[Math.floor(systemRng() * NPC_RESPONSES.length)];
        return { streakSeverity: severity, forcedEvent: false, npcResponse, moraleFloorApplied, newMorale, tensionApplied };
    }

    const result = { streakSeverity: severity, forcedEvent, moraleFloorApplied, newMorale, tensionApplied };

    if (streakLength >= 5) {
        result.responseOptions = RESPONSE_OPTIONS;
    }

    return result;
}

/**
 * Registra resultado de uma partida (W/D/L).
 */
export function recordResult({ teamId, result } = {}) {
    if (result === 'W') {
        _streaks.set(teamId, 0);
    } else if (result === 'L') {
        _streaks.set(teamId, (_streaks.get(teamId) || 0) + 1);
    }
    // Draw: no change
}

/**
 * Retorna streak atual de um time.
 */
export function getCurrentStreak(teamId) {
    return _streaks.get(teamId) || 0;
}

// ─── helpers ────────────────────────────────────────────────

function computeSeverity(streak) {
    if (streak >= 11) return 'collapse';
    if (streak >= 8)  return 'crisis';
    if (streak >= 5)  return 'serious';
    if (streak >= 3)  return 'mild';
    return 'none';
}
