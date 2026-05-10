/**
 * CognitiveBiases — MARL Fase 5
 *
 * Vieses cognitivos humanos aplicados ao mercado de transferências.
 * Cada função recebe dados objetivos + um fator de personalidade (0-1)
 * e retorna um valor distorcido que um humano real perceberia.
 *
 * Baseado em:
 *   - Kahneman & Tversky (1979) — Prospect Theory, Anchoring
 *   - Thaler (1980) — Endowment Effect
 *   - Arkes & Blumer (1985) — Sunk Cost Fallacy
 *   - Banerjee (1992) — Herd Behavior
 *   - Tversky & Kahneman (1973) — Availability/Recency Bias
 */

// ─── ANCHORING ────────────────────────────────────────────────

/**
 * Primeira oferta recebida "ancora" a percepção de valor do jogador.
 * Bots com OCEAN.C baixo (indisciplinados) são mais suscetíveis.
 *
 * @param {number} realValue — valor real de mercado
 * @param {number|null} firstOffer — primeira oferta que o bot viu por esse jogador
 * @param {number} anchorStrength — 0-1, quanto a âncora puxa (derivado de 1 - OCEAN.C)
 * @returns {number} valor percebido (entre firstOffer e realValue)
 */
export function applyAnchoring(realValue, firstOffer, anchorStrength = 0.3) {
    if (firstOffer == null || firstOffer <= 0) return realValue;
    // Interpola entre valor real e âncora
    // anchorStrength=0 → ignora âncora (racional puro)
    // anchorStrength=1 → 100% ancorado na primeira oferta
    const weight = Math.min(1, Math.max(0, anchorStrength * 0.6));
    return Math.round(realValue * (1 - weight) + firstOffer * weight);
}

// ─── SUNK COST FALLACY ───────────────────────────────────────

/**
 * Bot resiste a vender abaixo do preço que pagou, mesmo que o jogador
 * tenha depreciado. "Eu paguei caro, não vou entregar por menos."
 *
 * Bots com OCEAN.A alto (leais) e OCEAN.N alto (neuróticos) são
 * mais suscetíveis ao sunk cost.
 *
 * @param {number} purchasePrice — quanto o bot pagou pelo jogador (0 se da base)
 * @param {number} currentValue — valor de mercado atual
 * @param {number} sunkCostBias — 0-1 (derivado de (OCEAN.A + OCEAN.N) / 2)
 * @returns {number} preço mínimo aceitável de venda
 */
export function applySunkCost(purchasePrice, currentValue, sunkCostBias = 0.5) {
    if (purchasePrice <= 0) return currentValue; // jogador da base = sem sunk cost
    const bias = Math.min(1, Math.max(0, sunkCostBias));
    // Preço mínimo = interpolação entre valor atual e preço de compra
    // bias=0 → aceita o mercado (racional)
    // bias=1 → exige o preço original de volta
    const floor = currentValue * (1 - bias) + purchasePrice * bias;
    // Nunca abaixo de 70% do valor atual (sanidade)
    return Math.round(Math.max(currentValue * 0.7, floor));
}

// ─── ENDOWMENT EFFECT ────────────────────────────────────────

/**
 * "Meus jogadores valem mais." Humanos inflam o valor de coisas que possuem.
 *
 * Efeito universal (~1.3-1.5x), com leve modulação por OCEAN.A (lealdade).
 *
 * @param {number} value — valor de mercado
 * @param {boolean} isOwn — jogador pertence ao elenco do bot?
 * @param {number} loyaltyFactor — 0-1 (OCEAN.A do bot, default 0.5)
 * @returns {number} valor percebido
 */
export function applyEndowment(value, isOwn, loyaltyFactor = 0.5) {
    if (!isOwn) return value;
    // Base multiplier: 1.3x para bots racionais, até 1.6x para leais
    const multiplier = 1.3 + loyaltyFactor * 0.3;
    return Math.round(value * multiplier);
}

// ─── HERD BEHAVIOR ───────────────────────────────────────────

/**
 * Se muitos times compraram na posição X recentemente, o bot sente
 * urgência para fazer o mesmo. "Todo mundo tá contratando atacante,
 * preciso de um também!"
 *
 * Bots com OCEAN.N alto (neuróticos) e OCEAN.O baixo (conservadores)
 * são mais suscetíveis ao efeito manada.
 *
 * @param {Array<{position: string}>} recentLeagueTransfers — compras recentes na liga
 * @param {string} position — posição que o bot está avaliando
 * @param {number} herdSusceptibility — 0-1 (derivado de OCEAN.N, ou (N + (1-O)) / 2)
 * @returns {number} urgencyMultiplier 1.0-2.0
 */
export function applyHerdBehavior(recentLeagueTransfers, position, herdSusceptibility = 0.3) {
    if (!Array.isArray(recentLeagueTransfers) || recentLeagueTransfers.length === 0) {
        return 1.0;
    }
    const transfersInPosition = recentLeagueTransfers.filter(t => t.position === position).length;
    const ratio = transfersInPosition / Math.max(1, recentLeagueTransfers.length);
    // 0% da liga comprando na posição → 1.0x
    // 40%+ da liga comprando na posição → até 2.0x (se herdSusceptibility=1)
    const herdPressure = Math.min(1, ratio / 0.4);
    const urgency = 1.0 + herdPressure * herdSusceptibility;
    return Math.min(2.0, urgency);
}

// ─── SCARCITY PANIC ──────────────────────────────────────────

/**
 * Últimas semanas da janela de transferências: preços inflam
 * porque o bot entra em pânico. "Se não comprar agora, fico sem!"
 *
 * @param {number} windowWeeksLeft — semanas restantes na janela
 * @param {number} totalWindowWeeks — duração total da janela (ex: 8 semanas)
 * @param {number} panicSusceptibility — 0-1 (derivado de OCEAN.N)
 * @returns {number} priceMultiplier 1.0-1.8
 */
export function applyScarcityPanic(windowWeeksLeft, totalWindowWeeks, panicSusceptibility = 0.5) {
    if (totalWindowWeeks <= 0 || windowWeeksLeft >= totalWindowWeeks) return 1.0;
    // Fração de tempo restante (0 = acabou, 1 = início)
    const timeLeft = Math.max(0, windowWeeksLeft / totalWindowWeeks);
    // Urgência = inverso do tempo restante, exponencial
    // Últimas 25% da janela = efeito forte
    const rawPanic = Math.pow(1 - timeLeft, 2);
    // Modulado pela susceptibilidade do bot
    const panic = rawPanic * panicSusceptibility * 0.8;
    return Math.min(1.8, 1.0 + panic);
}

// ─── RECENCY BIAS ────────────────────────────────────────────

/**
 * Último jogo do jogador tem peso desproporcional na avaliação.
 * Hat-trick ontem = "vale ouro!" Fraco ontem = "não serve."
 *
 * Bots com OCEAN.O baixo (conservadores/pouco abertos) são mais
 * suscetíveis ao recency bias.
 *
 * @param {{ goals: number, assists: number, rating: number }} lastMatchStats
 * @param {number} recencyBias — 0-1 (derivado de 1 - OCEAN.O)
 * @returns {number} valueModifier — multiplicador sobre o valor (0.7 a 1.5)
 */
export function applyRecencyBias(lastMatchStats, recencyBias = 0.3) {
    if (!lastMatchStats) return 1.0;
    const { goals = 0, assists = 0, rating = 6.0 } = lastMatchStats;

    // Performance score: -1 (péssimo) a +1 (excepcional)
    let performanceScore = 0;
    performanceScore += Math.min(3, goals) * 0.25;    // até 0.75 de gols
    performanceScore += Math.min(2, assists) * 0.15;   // até 0.30 de assists
    performanceScore += (rating - 6.0) * 0.1;          // rating 6 = neutro

    // Clamp entre -1 e +1
    performanceScore = Math.max(-1, Math.min(1, performanceScore));

    // Modulado pelo bias: 0 = ignora último jogo, 1 = último jogo é tudo
    const modifier = 1.0 + performanceScore * recencyBias * 0.5;
    return Math.max(0.7, Math.min(1.5, modifier));
}

// ─── STATUS QUO BIAS ─────────────────────────────────────────

/**
 * Resistência a mudar o elenco. "Time que está ganhando não se mexe."
 * Aparece quando o bot está em boa fase — resiste a comprar/vender.
 *
 * @param {number} recentWinRate — taxa de vitória nas últimas 10 partidas (0-1)
 * @param {number} conscientiousness — OCEAN.C do bot (0-1)
 * @returns {number} changePenalty — 0 (sem resistência) a 1 (máxima resistência)
 */
export function applyStatusQuoBias(recentWinRate, conscientiousness = 0.5) {
    if (recentWinRate < 0.4) return 0; // perdendo = quer mudança
    // Ganhando muito + disciplinado = "não mexe no que tá funcionando"
    const winFactor = Math.min(1, (recentWinRate - 0.4) / 0.4); // 0 at 40%, 1 at 80%
    return winFactor * conscientiousness * 0.7;
}

// ─── COMPOSITE: Apply all biases to a transfer decision ──────

/**
 * Aplica todos os vieses relevantes de uma vez para decisão de compra.
 * Retorna o valor percebido e a urgência ajustada.
 *
 * @param {Object} params
 * @param {number} params.realValue — valor de mercado do alvo
 * @param {Object} params.personality — OCEAN personality object
 * @param {Object} [params.context] — { recentLeagueTransfers, windowWeeksLeft, totalWindowWeeks, lastMatchStats, recentWinRate }
 * @returns {{ perceivedValue: number, urgencyMod: number, biasesApplied: string[] }}
 */
export function applyBuyBiases({ realValue, personality, context = {} }) {
    const ocean = personality?.ocean || { O: 0.5, C: 0.5, E: 0.5, A: 0.5, N: 0.5 };
    const biasesApplied = [];
    let perceivedValue = realValue;
    let urgencyMod = 1.0;

    // Scarcity Panic
    if (context.windowWeeksLeft != null && context.totalWindowWeeks) {
        const panic = applyScarcityPanic(context.windowWeeksLeft, context.totalWindowWeeks, ocean.N);
        if (panic > 1.05) {
            perceivedValue = Math.round(perceivedValue * panic);
            biasesApplied.push(`SCARCITY(×${panic.toFixed(2)})`);
        }
    }

    // Herd Behavior
    if (context.recentLeagueTransfers && context.targetPosition) {
        const herdMod = applyHerdBehavior(context.recentLeagueTransfers, context.targetPosition, (ocean.N + (1 - ocean.O)) / 2);
        if (herdMod > 1.05) {
            urgencyMod *= herdMod;
            biasesApplied.push(`HERD(×${herdMod.toFixed(2)})`);
        }
    }

    // Recency Bias on target
    if (context.lastMatchStats) {
        const recMod = applyRecencyBias(context.lastMatchStats, 1 - ocean.O);
        if (Math.abs(recMod - 1.0) > 0.05) {
            perceivedValue = Math.round(perceivedValue * recMod);
            biasesApplied.push(`RECENCY(×${recMod.toFixed(2)})`);
        }
    }

    // Status Quo (resistance to buy)
    if (context.recentWinRate != null) {
        const sqPenalty = applyStatusQuoBias(context.recentWinRate, ocean.C);
        if (sqPenalty > 0.1) {
            urgencyMod *= (1 - sqPenalty);
            biasesApplied.push(`STATUS_QUO(−${(sqPenalty * 100).toFixed(0)}%)`);
        }
    }

    return { perceivedValue, urgencyMod, biasesApplied };
}

/**
 * Aplica todos os vieses relevantes para decisão de venda.
 *
 * @param {Object} params
 * @param {number} params.offerAmount — quanto estão oferecendo
 * @param {number} params.playerValue — valor de mercado do jogador
 * @param {number} params.purchasePrice — quanto o bot pagou (0 se da base)
 * @param {Object} params.personality — OCEAN personality object
 * @param {Object} [params.context] — { lastMatchStats }
 * @returns {{ minAcceptable: number, perceivedValue: number, biasesApplied: string[] }}
 */
export function applySellBiases({ offerAmount, playerValue, purchasePrice = 0, personality, context = {} }) {
    const ocean = personality?.ocean || { O: 0.5, C: 0.5, E: 0.5, A: 0.5, N: 0.5 };
    const biasesApplied = [];

    // Endowment Effect — "meu jogador vale mais"
    const endowedValue = applyEndowment(playerValue, true, ocean.A);
    biasesApplied.push(`ENDOWMENT(${playerValue}→${endowedValue})`);

    // Sunk Cost — "paguei caro, não entrego barato"
    const sunkCostBias = (ocean.A + ocean.N) / 2;
    const minAcceptable = applySunkCost(purchasePrice, endowedValue, sunkCostBias);
    if (purchasePrice > 0) {
        biasesApplied.push(`SUNK_COST(min=${minAcceptable})`);
    }

    // Recency Bias — "fez gol ontem, vale ouro"
    let perceivedValue = endowedValue;
    if (context.lastMatchStats) {
        const recMod = applyRecencyBias(context.lastMatchStats, 1 - ocean.O);
        perceivedValue = Math.round(perceivedValue * recMod);
        if (Math.abs(recMod - 1.0) > 0.05) {
            biasesApplied.push(`RECENCY(×${recMod.toFixed(2)})`);
        }
    }

    return { minAcceptable, perceivedValue, biasesApplied };
}
