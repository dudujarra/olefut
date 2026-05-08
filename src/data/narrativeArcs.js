/**
 * Narrative Arcs — 6 arcos nomeados Camada 4 (v1.4)
 *
 * SPEC-049: arcos abertos automaticamente em response a thresholds de Camada 3.
 *
 * Schema: { id, name, description, triggerCondition, closureCondition, headline }
 */

export const NARRATIVE_ARCS = Object.freeze([
    {
        id: 'arc_maldicao_aflitos',
        name: 'A Maldição dos Aflitos',
        description: 'Sequência de derrotas dolorosas em finais. Trauma geracional acumulando.',
        triggerCondition: { type: 'finals_lost', count: 3 },
        closureCondition: { type: 'final_won' },
        headline: '🔮 Imprensa decreta: {clube} vive A MALDIÇÃO DOS AFLITOS após {n} finais perdidas.'
    },
    {
        id: 'arc_anos_chumbo',
        name: 'Os Anos de Chumbo',
        description: 'Período de pressão extrema com torcida revoltada e diretoria à beira.',
        triggerCondition: { type: 'morale_low_streak', weeks: 8 },
        closureCondition: { type: 'morale_recovery' },
        headline: '⚫ {clube} entra nos ANOS DE CHUMBO. Vestiário em frangalhos, torcida revoltada.'
    },
    {
        id: 'arc_vinganca_lenta',
        name: 'A Vingança Lenta',
        description: 'Após anos sendo carrasco, o {clube} planeja a virada definitiva contra {rival}.',
        triggerCondition: { type: 'rivalry_high', threshold: 70 },
        closureCondition: { type: 'derby_revenge_won' },
        headline: '⚔️ Imprensa fareja A VINGANÇA LENTA: {clube} prepara a resposta a {rival}.'
    },
    {
        id: 'arc_renascimento',
        name: 'O Renascimento',
        description: 'Após período sombrio, time encontra identidade e forma equipe vitoriosa.',
        triggerCondition: { type: 'win_streak', count: 5 },
        closureCondition: { type: 'title_won' },
        headline: '🌅 O RENASCIMENTO começou. {clube} alinha ataque, defesa e moral.'
    },
    {
        id: 'arc_sombra_pai',
        name: 'A Sombra do Pai',
        description: 'Filho de ídolo lutando para sair da comparação eterna com o pai.',
        triggerCondition: { type: 'regen_child_struggling', performance: 'low' },
        closureCondition: { type: 'regen_child_breakthrough' },
        headline: '👤 {regen} luta sob A SOMBRA DO PAI. Comparações com {parent_name} pesam.'
    },
    {
        id: 'arc_dinastia',
        name: 'A Dinastia',
        description: 'Sequência de títulos consolida o time como geração histórica.',
        triggerCondition: { type: 'consecutive_titles', count: 3 },
        closureCondition: { type: 'cycle_ends' },
        headline: '👑 A DINASTIA está em curso. {clube} acumula {n} títulos seguidos.'
    }
]);

/**
 * Lookup arc by id.
 */
export function getArc(arcId) {
    return NARRATIVE_ARCS.find(a => a.id === arcId) || null;
}

export const ARCS_COUNT = NARRATIVE_ARCS.length;
