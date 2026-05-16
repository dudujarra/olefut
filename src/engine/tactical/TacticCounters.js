/**
 * Tactic Counter System — rock-paper-scissors
 * Returns effectiveness modifier for attacker's tactic vs defender's tactic
 */
export const TACTIC_COUNTERS = {
    // [attacker][defender] = modifier
    normal:     { normal: 1.0, offensive: 1.0, defensive: 1.0, pressing: 1.0, counter: 1.0, possession: 1.0 },
    offensive:  { normal: 1.1, offensive: 1.0, defensive: 0.7, pressing: 1.15, counter: 0.8, possession: 1.1 },
    defensive:  { normal: 0.9, offensive: 1.3, defensive: 1.0, pressing: 0.9, counter: 1.1, possession: 0.85 },
    pressing:   { normal: 1.05, offensive: 0.85, defensive: 1.1, pressing: 1.0, counter: 0.7, possession: 1.2 },
    counter:    { normal: 1.0, offensive: 1.2, defensive: 0.9, pressing: 1.3, counter: 1.0, possession: 0.9 },
    possession: { normal: 1.0, offensive: 0.9, defensive: 1.15, pressing: 0.8, counter: 1.1, possession: 1.0 },
};

/**
 * Formation Counter System — rock-paper-scissors based on Deep Tactical Reference
 * Base multiplier on zone control (lambda/mu)
 * Matrix: 4-4-2, 4-3-3, 4-2-4, 3-5-2, 5-3-2
 */
export const FORMATION_COUNTERS = {
    // [attackerFormation][defenderFormation] = modifier
    '4-4-2': { '4-4-2': 1.0,  '4-3-3': 0.85, '4-2-4': 1.15, '3-5-2': 0.85, '5-3-2': 1.15 },
    '4-3-3': { '4-4-2': 1.15, '4-3-3': 1.0,  '4-2-4': 1.15, '3-5-2': 0.85, '5-3-2': 0.85 },
    '4-2-4': { '4-4-2': 0.85, '4-3-3': 0.85, '4-2-4': 1.0,  '3-5-2': 0.75, '5-3-2': 1.15 },
    '3-5-2': { '4-4-2': 1.15, '4-3-3': 1.15, '4-2-4': 1.25, '3-5-2': 1.0,  '5-3-2': 1.0  },
    '5-3-2': { '4-4-2': 0.85, '4-3-3': 1.15, '4-2-4': 0.85, '3-5-2': 1.0,  '5-3-2': 1.0  },
};
