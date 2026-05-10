/**
 * GameplayHeuristics — Monotony Detection & Design Insights
 *
 * Pure function utilities consumed by AutoPlayService:
 *   - detectMonotonyHeuristic: flags tactical/standing/balance stagnation
 *   - generateGameDesignInsights: maps telemetry scores to actionable fixes
 */

// ============================================================
// MONOTONY DETECTION + GAMEPLAY SUGGESTIONS
// ============================================================

/**
 * Detects gameplay monotony and returns actionable suggestions.
 *
 * gameState: {
 *   currentTactic, tacticStreak,        // tactic stuck
 *   position, positionStreak,            // standing freeze
 *   streak,                              // win/loss streak
 *   avgOVR, balance, squadSize,
 *   division, seasonNumber,
 *   winRate,                             // overall win %
 * }
 */
export function detectMonotonyHeuristic(gameState) {
    const signals = [];
    const suggestions = [];

    const {
        currentTactic = 'normal', tacticStreak = 0,
        position = 10, positionStreak = 0,
        streak = 0, avgOVR = 50, balance = 0, squadSize = 22,
        division = 4, winRate = 0.33
    } = gameState || {};

    // --- Tactic monotony ---
    if (tacticStreak >= 8) {
        signals.push({ id: 'TACTIC_STUCK', msg: `Mesma tática '${currentTactic}' há ${tacticStreak} sem` });
        const TACTICS = ['offensive', 'defensive', 'counter', 'normal'];
        const alt = TACTICS.find(t => t !== currentTactic) || 'counter';
        suggestions.push({ action: 'CHANGE_TACTIC', value: alt, reason: `tática ${currentTactic} monótona` });
    }

    // --- Standing freeze ---
    if (positionStreak >= 6) {
        signals.push({ id: 'STANDING_FREEZE', msg: `${position}º lugar há ${positionStreak} sem` });
        if (streak <= 0) {
            // Stuck + not winning: go more aggressive
            suggestions.push({ action: 'CHANGE_TACTIC', value: 'offensive', reason: 'parado na tabela' });
        }
        if (position <= 2) {
            // About to promote: strengthen squad
            suggestions.push({ action: 'SCOUT', reason: 'reforçar antes da divisão acima' });
        }
    }

    // --- Balance crisis ---
    if (balance < 0 && squadSize > 20) {
        signals.push({ id: 'FINANCIAL_CRISIS', msg: `Balanço negativo R$ ${(balance / 1e6).toFixed(1)}M com ${squadSize} jogadores` });
        // Not a tactic suggestion but flags the issue
    }

    // --- OVR stagnation ---
    if (avgOVR < 55 && division <= 2 && winRate < 0.3) {
        signals.push({ id: 'OVR_GAP', msg: `OVR médio ${avgOVR} na divisão ${division}, winRate ${(winRate * 100).toFixed(0)}%` });
        suggestions.push({ action: 'SCOUT', reason: 'elenco fraco para a divisão' });
    }

    // --- Formation monotony (not a signal, just a suggestion if tactics stuck) ---
    if (tacticStreak >= 12 && !suggestions.find(s => s.action === 'CHANGE_FORMATION')) {
        suggestions.push({ action: 'CHANGE_FORMATION', reason: 'formação estagnada' });
    }

    return {
        monotonous: signals.length > 0,
        severity: signals.length,
        signals,
        suggestions,
        topSuggestion: suggestions[0] || null
    };
}

/**
 * Generates game design insights from a telemetry SPEC report.
 * Maps low-scoring detectors to actionable engine/design changes.
 *
 * report: the .report object from AutoPlay telemetry
 * Returns array of { spec, score, insight, fix }
 */
export function generateGameDesignInsights(report) {
    if (!report?.results) return [];
    const insights = [];

    const r = report.results;

    if (r['SPEC-100']?.score < 40) {
        const sigs = r['SPEC-100'].signals?.map(s => s.msg).join('; ') || '';
        insights.push({
            spec: 'SPEC-100', score: r['SPEC-100'].score,
            problem: `Monotonia alta. ${sigs}`,
            fix: 'AutoPlay precisa de tática dinâmica: mudar tática automaticamente após 4+ sem sem vitória. Adicionar mais variedade na seleção de formação.'
        });
    }

    if (r['SPEC-102']?.score < 60) {
        insights.push({
            spec: 'SPEC-102', score: r['SPEC-102'].score,
            problem: 'Fun score baixo — partidas previsíveis.',
            fix: 'Aumentar variância nos resultados. Checar se matchSimulator usa aleatoriedade suficiente. Adicionar eventos inesperados (VAR, lesão-chave, penalti controverso).'
        });
    }

    if (r['SPEC-104']?.score < 50) {
        const dead = r['SPEC-104'].signals?.find(s => s.id === 'DEAD_VIEW')?.msg || '';
        insights.push({
            spec: 'SPEC-104', score: r['SPEC-104'].score,
            problem: `Views mortas no AutoPlay. ${dead}`,
            fix: 'AutoPlay deveria visitar mais views: matchView pós-partida, playerProfile quando craque emerge, continental cup view quando Libertadores começa.'
        });
    }

    if (r['SPEC-105']?.score < 80) {
        const top = r['SPEC-105'].topNarrators?.[0];
        insights.push({
            spec: 'SPEC-105', score: r['SPEC-105'].score,
            problem: `Narração repetida. Top: "${top?.[0]}" ×${top?.[1]}`,
            fix: 'Adicionar mais templates de evento vestiário. Variar com número de jogadores e condições específicas. Usar adjetivos dinâmicos.'
        });
    }

    if (r['SPEC-107']?.score < 80) {
        const gini = r['SPEC-107']?.giniCoefficient;
        insights.push({
            spec: 'SPEC-107', score: r['SPEC-107'].score,
            problem: `Identidade de jogador concentrada (GINI ${gini}). Um jogador domina todos os gols.`,
            fix: 'Distribuir gols por mais jogadores. Checar se recordMatchStats está sendo chamado para todos titulares, não só o centroavante.'
        });
    }

    if (r['SPEC-108']?.score < 50) {
        const top = r['SPEC-108']?.topRivals?.[0];
        insights.push({
            spec: 'SPEC-108', score: r['SPEC-108'].score,
            problem: `Rivalidades não emergem. ${top ? `${top.oppName} enfrentado ${top.encounters}× sem rivalidade.` : ''}`,
            fix: 'Implementar SPEC-055: após 20+ confrontos criar tag "rival". Exibir histórico H2H na tela pré-jogo. Adicionar evento narrativo "clássico do botão".'
        });
    }

    if (r['SPEC-111']?.score < 70) {
        insights.push({
            spec: 'SPEC-111', score: r['SPEC-111'].score,
            problem: 'Liquidez de mercado baixa — ofertas não sendo aceitas.',
            fix: 'Revisar threshold de buy offer. Bot oferta value × 1.3 mas AI aceita apenas value × 1.5+? Calibrar aceitação em makeBuyOffer. Verificar se player.value está setado corretamente nos jogadores de AI.'
        });
    }

    return insights.sort((a, b) => a.score - b.score);
}
