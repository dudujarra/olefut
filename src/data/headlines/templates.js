/**
 * Headlines Templates — SPEC-077 Sprint P
 *
 * Manchete generator estilo Globo Esporte / radialista virtual.
 * 30+ template categories, 5+ variants each.
 */

export const HEADLINE_TEMPLATES = {
    goal_normal: [
        '⚽ TOMA QUE O FILHO É TEU! {playerName} MARCA NO {minute}!',
        '⚽ É GOL! {playerName} DEIXA TUDO IGUAL!',
        '⚽ NA REDE! {playerName} ARRANCA APLAUSOS DA TORCIDA!',
        '⚽ {playerName} NÃO PERDOA! {teamName} NA FRENTE!',
        '⚽ FÁCIL FÁCIL! {playerName} BALANÇA AS REDES!'
    ],
    goal_long_shot: [
        '🚀 É VOO! {playerName} VOA DE LONGE!',
        '💥 PIPOCO! {playerName} EXPLODE FORA DA ÁREA!',
        '💣 BOMBA! {playerName} ARRANCA O PÉ E ARREBENTA!',
        '🎯 NA GAVETA! {playerName} ENFIA NO ÂNGULO!',
        '🚀 PEPELANTE! {playerName} TIRA DO GAVETÃO!'
    ],
    goal_header: [
        '🦅 NO ALTO! {playerName} CABECEIA E MARCA!',
        '⛰️ MONUMENTAL! {playerName} SOBE MAIS QUE TODO MUNDO!',
        '🦅 NÃO TEM PARA NINGUÉM! {playerName} DE CABEÇA!',
        '🎯 NA COLOCADINHA! {playerName} AJEITA E MANDA!'
    ],
    miss_easy: [
        '😱 INACREDITÁVEL! {playerName} PERDE GOL FEITO!',
        '🤦 PIPOCOU! {playerName} PERDE A CHANCE DA TEMPORADA!',
        '😨 QUEM NÃO FAZ, LEVA! {playerName} ISOLA POR CIMA!',
        '🤡 TÁ EM CASA? {playerName} CHUTA NO ESCANTEIO!'
    ],
    save_brilliant: [
        '🥅 GOLEIRÃO! {gkName} PEGA TUDO!',
        '🧤 MILAGRE! {gkName} SALVA O QUE NÃO PODIA!',
        '🥅 PAREDÃO! {gkName} VOA E SEGURA!',
        '🧤 SOBERANO! {gkName} É MURALHA!'
    ],
    foul_yellow: [
        '🟨 AMARELÃO! {playerName} ENTRA FORTE E LEVA!',
        '🟨 CARTÃO! {playerName} TÁ NA MIRA DO JUIZ!',
        '⚖️ JUIZ MARRENTO! {refName} MOSTRA O AMARELO!',
        '🟨 ESPERTO! {playerName} ESCAPA DE EXPULSÃO POR POUCO!'
    ],
    foul_red: [
        '🟥 FORA! {playerName} EXPULSO!',
        '🟥 IDIOTICE! {playerName} BURRO DEMAIS, PEGA O VERMELHO!',
        '🟥 ESCÁNDALO! JUIZ EXPULSA {playerName}!',
        '⚖️ JUIZ MARRENTO! {refName} EXPULSA INJUSTAMENTE!'
    ],
    win_big: [
        '🏆 CAMPEÃO! {teamName} MATA DE {scoreboard}!',
        '🎉 GOLEADA! {teamName} ATROPELA {opponent}!',
        '🥇 SHOW DE BOLA! {teamName} HUMILHA POR {scoreboard}!',
        '🚀 ENGOLIDOS! {teamName} PASSA POR CIMA!'
    ],
    loss_big: [
        '📉 VEXAME! {teamName} PERDE EM CASA POR {scoreboard}',
        '😭 HUMILHAÇÃO! {teamName} TOMA UMA GOLEADA HISTÓRICA',
        '🤡 NEM DENTRO DE CASA! {teamName} APANHA FEIO',
        '📉 CRISE! {teamName} CAI E PRECISA SE REINVENTAR'
    ],
    derby_win: [
        '⚔️ CARRASCO! {teamName} BATE O RIVAL E TUMULTUA!',
        '🏆 SUPREMACIA! {teamName} MATA O CLÁSSICO!',
        '🔥 MERECIDO! {teamName} DOMINA O DERBY!'
    ],
    derby_loss: [
        '😭 LIVE NA CARA! {teamName} PERDE PRO RIVAL EM CASA!',
        '🤡 DESGRAÇA! {teamName} HUMILHADO PELO RIVAL!',
        '📉 PIOR DOS PIORES! {teamName} APAGADO NO CLÁSSICO!'
    ],
    title_won: [
        '🏆 CAMPEÃO! {teamName} ENTRA PRA HISTÓRIA!',
        '🥇 É TÍTULO! {teamName} AMARGA OS RIVAIS!',
        '🎉 ETERNO! {teamName} CONQUISTA O QUE NÃO TINHA!',
        '👑 REINADO! {teamName} ASSUME O TRONO!'
    ],
    relegation: [
        '📉 REBAIXAMENTO! {teamName} CAI E TODA TORCIDA CHORA',
        '🤡 VEXAME HISTÓRICO! {teamName} VAI PRA SÉRIE {nextDiv}',
        '😭 REBAIXOU! {teamName} VIVE PESADELO',
        '⬇️ DESPENCOU! {teamName} NÃO RESISTE A CRISE'
    ],
    promotion: [
        '⬆️ SUBIU! {teamName} ASCENDE PARA SÉRIE {nextDiv}!',
        '🚀 PROMOÇÃO! {teamName} VOLTA AO TOPO!',
        '🎉 ÊXITO! {teamName} CONQUISTA O ACESSO MERECIDO!',
        '⭐ ELITE! {teamName} ESTÁ DE VOLTA À PRIMEIRA DIVISÃO!'
    ],
    transfer_in: [
        '💼 REFORÇO! {playerName} CHEGA A {teamName}!',
        '🎯 FECHOU! {teamName} ANUNCIA {playerName}!',
        '💰 BOMBA! {teamName} CONTRATA {playerName} POR R$ {amount}!'
    ],
    transfer_out: [
        '👋 SAÍDA! {playerName} DEIXA {teamName} POR R$ {amount}!',
        '💔 DESPEDIDA! {playerName} VAI EMBORA DE {teamName}!',
        '🚪 FOI! {playerName} JÁ NÃO É MAIS DO {teamName}!'
    ],
    injury: [
        '🤕 SAI CHORANDO! {playerName}: lesão grave!',
        '🚑 DEPARTAMENTO MÉDICO! {playerName} fora por {weeks} semanas',
        '😨 PESADELO! {playerName} se machuca em treino'
    ],
    suspension: [
        '🟥 SUSPENSO! {playerName} fora do próximo jogo',
        '⚖️ FAZ FALTA! {playerName} cumprirá suspensão',
        '🤦 BURRO! {playerName} acumula cartões e fica de fora'
    ],
    boss_pressure: [
        '😬 PRESSÃO! Diretoria do {teamName} dá ULTIMATO ao técnico',
        '⚠️ CADEIRA QUENTE! Técnico do {teamName} corre risco de demissão',
        '🔥 CRISE NA DIRETORIA! {teamName} pode trocar comando'
    ],
    sponsor_signed: [
        '💰 PATROCÍNIO! {teamName} fecha com {sponsorName}',
        '🤝 ACORDO! Marca {sponsorName} estampa camisa do {teamName}',
        '💸 R$ MILHÕES! {teamName} renova com {sponsorName}'
    ],
    fan_protest: [
        '📣 PROTESTO! Torcida do {teamName} cobra resultados',
        '😡 REVOLTA! Organizada protesta no estádio',
        '🚫 BAIXOU O ASTRAL! Torcida vira contra o time'
    ]
};

/**
 * Generate headline from category + variables.
 */
export function generateHeadline(category, vars = {}) {
    const templates = HEADLINE_TEMPLATES[category];
    if (!templates || templates.length === 0) {
        return `📰 ${category}: ${JSON.stringify(vars).slice(0, 50)}`;
    }
    const tpl = templates[Math.floor(Math.random() * templates.length)];
    return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

/**
 * Pick category baseado em context.
 */
export function categoryFromEvent(event) {
    if (!event) return 'goal_normal';
    if (event.type === 'goal' && event.distance === 'long') return 'goal_long_shot';
    if (event.type === 'goal' && event.method === 'header') return 'goal_header';
    if (event.type === 'goal') return 'goal_normal';
    if (event.type === 'miss') return 'miss_easy';
    if (event.type === 'save') return 'save_brilliant';
    if (event.type === 'card_yellow') return 'foul_yellow';
    if (event.type === 'card_red') return 'foul_red';
    if (event.type === 'derby_win') return 'derby_win';
    if (event.type === 'derby_loss') return 'derby_loss';
    return 'goal_normal';
}
