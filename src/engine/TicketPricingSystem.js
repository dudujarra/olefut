/**
 * TicketPricingSystem.js — Controle de Preço dos Ingressos
 *
 * Mecânica clássica do Elifoot: o manager define a política de preços.
 * - Barato: lota o estádio, vantagem em casa brutal, renda baixa.
 * - Normal: padrão equilibrado.
 * - Caro: meia-lotação, pouca vantagem em casa, renda alta se time está bem.
 *
 * Stateless. Recebe dados, retorna modificadores.
 *
 * Fluxo:
 * 1. UI chama setTicketPolicy(engine, policyId)
 * 2. calculateWeeklyFinances lê engine.ticketPolicy para bilheteria
 * 3. MatchSimulator lê getHomeAdvantageFromTickets(engine) para xG
 */

// ============================================================
// POLÍTICAS DE INGRESSO
// ============================================================
export const TICKET_POLICIES = [
    {
        id: 'cheap',
        name: 'Ingresso Popular',
        emoji: '🎟️',
        priceMultiplier: 0.5,       // receita = 50% do normal
        attendanceMultiplier: 1.3,  // +30% público
        homeAdvantageBoost: 1.08,   // +8% vantagem em casa nos setores
        moralWeeklyBoost: 1,        // torcida feliz = +1 moral/semana
        description: 'Ingresso barato lota o estádio. Torcida empurra o time em casa, mas a renda despenca.',
    },
    {
        id: 'normal',
        name: 'Ingresso Normal',
        emoji: '🏟️',
        priceMultiplier: 1.0,
        attendanceMultiplier: 1.0,
        homeAdvantageBoost: 1.0,
        moralWeeklyBoost: 0,
        description: 'Preço padrão. Equilíbrio entre renda e público.',
    },
    {
        id: 'expensive',
        name: 'Ingresso Premium',
        emoji: '💎',
        priceMultiplier: 1.8,       // receita = 180% do normal
        attendanceMultiplier: 0.6,  // -40% público
        homeAdvantageBoost: 0.95,   // -5% vantagem em casa
        moralWeeklyBoost: -1,       // torcida reclamando = -1 moral/semana
        description: 'Preços altos rendem muito, mas esvaziam o estádio. Time perde vantagem em casa.',
    },
];

/**
 * Define a política de ingressos do clube.
 *
 * @param {Engine} engine
 * @param {string} policyId — 'cheap' | 'normal' | 'expensive'
 * @returns {{ success: boolean, msg: string, policy?: object }}
 */
export function setTicketPolicy(engine, policyId) {
    const policy = TICKET_POLICIES.find(p => p.id === policyId);
    if (!policy) return { success: false, msg: 'Política inválida.' };

    engine.ticketPolicy = policyId;
    return {
        success: true,
        msg: `${policy.emoji} Política de ingressos alterada para "${policy.name}". ${policy.description}`,
        policy,
    };
}

/**
 * Retorna a política ativa (ou 'normal' por default).
 *
 * @param {Engine} engine
 * @returns {object} policy tier
 */
export function getActiveTicketPolicy(engine) {
    const policyId = engine.ticketPolicy || 'normal';
    return TICKET_POLICIES.find(p => p.id === policyId) || TICKET_POLICIES[1];
}

/**
 * Retorna o modificador de vantagem em casa para o MatchSimulator.
 * Aplicado nos setores do time mandante (home team).
 *
 * @param {Engine} engine
 * @returns {number} multiplicador (ex: 1.08 = +8% vantagem)
 */
export function getHomeAdvantageFromTickets(engine) {
    return getActiveTicketPolicy(engine).homeAdvantageBoost;
}

/**
 * Retorna modificadores financeiros para calculateWeeklyFinances.
 *
 * @param {Engine} engine
 * @returns {{ priceMultiplier: number, attendanceMultiplier: number }}
 */
export function getTicketFinanceModifiers(engine) {
    const policy = getActiveTicketPolicy(engine);
    return {
        priceMultiplier: policy.priceMultiplier,
        attendanceMultiplier: policy.attendanceMultiplier,
    };
}

/**
 * Retorna o boost de moral semanal da torcida.
 * Chamado pelo WeekProcessor.
 *
 * @param {Engine} engine
 * @returns {number} moral change per week (-1, 0, or +1)
 */
export function getTicketMoralBoost(engine) {
    return getActiveTicketPolicy(engine).moralWeeklyBoost;
}
