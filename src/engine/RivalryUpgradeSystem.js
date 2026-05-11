/* eslint-disable no-unused-vars */
/**
 * RivalryUpgradeSystem — SPEC-080: Rivalidades com Peso Narrativo Real
 *
 * Expande SPEC-017 (derby básico): criticalCount real + 6 arcos nomeados.
 * Resolve: rivais se enfrentam 11x mas criticalCount=0 (nenhum decisivo).
 *
 * Stateless: recebe histórico de confrontos, retorna estado de rivalidade.
 */

const NAMED_ARCS = [
    { id: 'classico_eterno',   threshold: 10, name: 'Clássico Eterno',   description: '10+ confrontos registrados' },
    { id: 'batalha_das_geracoes', threshold: 20, name: 'Batalha das Gerações', description: '20+ confrontos com múltiplas eras' },
    { id: 'revanche',          threshold: 5,  name: 'Revanche',          description: '3+ vitórias consecutivas de um lado' },
    { id: 'equilíbrio_perfeito', threshold: 0, name: 'Equilíbrio Perfeito', description: 'Winrate entre 45-55% para ambos' },
    { id: 'dominio_absoluto',  threshold: 0,  name: 'Domínio Absoluto',  description: 'Um lado com 70%+ winrate' },
    { id: 'confronto_titulo',  threshold: 0,  name: 'Confronto de Título', description: 'Ambos disputaram título no mesmo ano' },
];

/**
 * Avalia estado atual de uma rivalidade entre dois clubes.
 *
 * @param {object} opts
 * @param {number} opts.clubAId
 * @param {number} opts.clubBId
 * @param {Array<{clubAScore, clubBScore, week, season, isDecisive}>} [opts.history=[]]
 * @param {boolean} [opts.bothInTitleRace=false]
 * @returns {{ rivalryScore, criticalCount, activeArc, h2h, namedRivalry }}
 */
export function evaluate({ clubAId, clubBId, history = [], bothInTitleRace = false } = {}) {
    const total = history.length;
    const aWins = history.filter(m => m.clubAScore > m.clubBScore).length;
    const bWins = history.filter(m => m.clubBScore > m.clubAScore).length;
    const draws = total - aWins - bWins;
    const criticalCount = history.filter(m => m.isDecisive).length;

    const aWinRate = total > 0 ? aWins / total : 0;
    const bWinRate = total > 0 ? bWins / total : 0;

    // Rivalry score 0-100
    const rivalryScore = Math.min(100, Math.round(total * 4 + criticalCount * 10));

    const h2h = { total, aWins, bWins, draws, aWinRate, bWinRate, criticalCount };

    // Determine active arc
    const activeArc = pickArc({ total, aWinRate, bWinRate, criticalCount, bothInTitleRace, history });

    const namedRivalry = rivalryScore >= 40;

    return { rivalryScore, criticalCount, activeArc, h2h, namedRivalry };
}

/**
 * Registra confronto crítico (decisivo para título/classificação).
 */
export function markCritical(match) {
    return { ...match, isDecisive: true };
}

// ─── helpers ────────────────────────────────────────────────

function pickArc({ total, aWinRate, bWinRate, criticalCount, bothInTitleRace, history }) {
    if (bothInTitleRace) return NAMED_ARCS.find(a => a.id === 'confronto_titulo');
    // Match-count arcs take priority (historia > equilíbrio momentâneo)
    if (total >= 20) return NAMED_ARCS.find(a => a.id === 'batalha_das_geracoes');
    if (total >= 10) return NAMED_ARCS.find(a => a.id === 'classico_eterno');
    if (aWinRate >= 0.7 || bWinRate >= 0.7) return NAMED_ARCS.find(a => a.id === 'dominio_absoluto');
    if (Math.abs(aWinRate - bWinRate) < 0.1 && total >= 5) return NAMED_ARCS.find(a => a.id === 'equilíbrio_perfeito');
    // Check revenge arc: 3+ consecutive wins for one side
    if (history.length >= 3) {
        const last3 = history.slice(-3);
        const allAWins = last3.every(m => m.clubAScore > m.clubBScore);
        const allBWins = last3.every(m => m.clubBScore > m.clubAScore);
        if (allAWins || allBWins) return NAMED_ARCS.find(a => a.id === 'revanche');
    }
    return null;
}
