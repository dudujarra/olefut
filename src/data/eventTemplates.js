/**
 * Event Templates — 80 atomic event handwritten templates
 *
 * SPEC-049 Camada 2 EVENTUAL v1.0.7 MVP.
 *
 * Schema per template:
 *   {
 *     id: string (unique),
 *     type: EVENT_TYPES key,
 *     defaults: { valence, intensity, tags, narrativeWeight },
 *     headline: template string com slots {chave}
 *   }
 *
 * Pattern: NarrativeService.appendEventFromTemplate(save, templateId, ctx)
 *   → resolves template + applies defaults + fills slots
 */

import { EVENT_TYPES } from './eventTypes';
import { EVENT_TAGS } from './eventTags';

export const EVENT_TEMPLATES = Object.freeze([
    // ========================================================================
    // PLAYER_GOAL_DECISIVE (8 templates)
    // ========================================================================
    {
        id: 'goal_late_winner',
        type: EVENT_TYPES.PLAYER_GOAL_DECISIVE,
        defaults: {
            valence: 80, intensity: 85,
            tags: [EVENT_TAGS.EPICO, EVENT_TAGS.ALIVIO],
            narrativeWeight: 3
        },
        headline: '⚽ {jogador} salva o {clube} aos {minuto}\'! Gol decisivo no apagar das luzes.'
    },
    {
        id: 'goal_classic_winner',
        type: EVENT_TYPES.PLAYER_GOAL_DECISIVE,
        defaults: {
            valence: 90, intensity: 95,
            tags: [EVENT_TAGS.EPICO, EVENT_TAGS.RIVAL_DIRETO, EVENT_TAGS.IDOLO],
            narrativeWeight: 5
        },
        headline: '⚽ {jogador} cala o estádio do {rival}! Gol da vitória no clássico.'
    },
    {
        id: 'goal_artilheiro_passes',
        type: EVENT_TYPES.PLAYER_GOAL_DECISIVE,
        defaults: {
            valence: 70, intensity: 70,
            tags: [EVENT_TAGS.IDOLO, EVENT_TAGS.MIDIATICO],
            narrativeWeight: 2
        },
        headline: '⚽ {jogador} chega ao {n}º gol na temporada e assume artilharia.'
    },
    {
        id: 'goal_pen_calmo',
        type: EVENT_TYPES.PLAYER_GOAL_DECISIVE,
        defaults: {
            valence: 60, intensity: 65,
            tags: [EVENT_TAGS.EPICO],
            narrativeWeight: 2
        },
        headline: '⚽ {jogador} bate pênalti com frieza aos {minuto}\' e empurra o {clube} pra final.'
    },
    {
        id: 'goal_chuva_milagre',
        type: EVENT_TYPES.PLAYER_GOAL_DECISIVE,
        defaults: {
            valence: 75, intensity: 80,
            tags: [EVENT_TAGS.MILAGRE, EVENT_TAGS.SURPRESA],
            narrativeWeight: 3
        },
        headline: '⚽ Sob a chuva, {jogador} marca um gol improvável e arranca empate pro {clube}.'
    },
    {
        id: 'goal_volta_olimpica',
        type: EVENT_TYPES.PLAYER_GOAL_DECISIVE,
        defaults: {
            valence: 100, intensity: 100,
            tags: [EVENT_TAGS.TITULO, EVENT_TAGS.EPICO, EVENT_TAGS.IDOLO],
            narrativeWeight: 5
        },
        headline: '⚽ {jogador} marca na final e leva o {clube} ao título! Festa eterna.'
    },
    {
        id: 'goal_acrobatico',
        type: EVENT_TYPES.PLAYER_GOAL_DECISIVE,
        defaults: {
            valence: 85, intensity: 90,
            tags: [EVENT_TAGS.EPICO, EVENT_TAGS.MIDIATICO, EVENT_TAGS.SURPRESA],
            narrativeWeight: 4
        },
        headline: '⚽ {jogador} faz gol acrobático que vai rodar o mundo. Imprensa especializada já compara a {idolo_anterior}.'
    },
    {
        id: 'goal_estreante_brilha',
        type: EVENT_TYPES.PLAYER_GOAL_DECISIVE,
        defaults: {
            valence: 70, intensity: 75,
            tags: [EVENT_TAGS.JOVEM, EVENT_TAGS.SURPRESA, EVENT_TAGS.CRIA_DA_BASE],
            narrativeWeight: 3
        },
        headline: '⚽ {jogador}, {idade} anos, marca em sua estreia. Joia da base entra pra história jovem do {clube}.'
    },

    // ========================================================================
    // PLAYER_RED_CARD (5 templates)
    // ========================================================================
    {
        id: 'red_temper_meltdown',
        type: EVENT_TYPES.PLAYER_RED_CARD,
        defaults: {
            valence: -70, intensity: 75,
            tags: [EVENT_TAGS.VERGONHA, EVENT_TAGS.POLEMICA],
            narrativeWeight: 2
        },
        headline: '🟥 {jogador} perde a cabeça e é expulso aos {minuto}\'. Decisão polêmica do árbitro.'
    },
    {
        id: 'red_arbitragem_questionavel',
        type: EVENT_TYPES.PLAYER_RED_CARD,
        defaults: {
            valence: -50, intensity: 70,
            tags: [EVENT_TAGS.ARBITRAGEM, EVENT_TAGS.POLEMICA],
            narrativeWeight: 2
        },
        headline: '🟥 Cartão vermelho duvidoso pra {jogador}. Imprensa questiona arbitragem.'
    },
    {
        id: 'red_brigao_chao',
        type: EVENT_TYPES.PLAYER_RED_CARD,
        defaults: {
            valence: -80, intensity: 80,
            tags: [EVENT_TAGS.VERGONHA, EVENT_TAGS.POLEMICA, EVENT_TAGS.RIVAL_DIRETO],
            narrativeWeight: 3
        },
        headline: '🟥 Confusão generalizada! {jogador} é expulso após dividida violenta no clássico.'
    },
    {
        id: 'red_capitao_simbolo',
        type: EVENT_TYPES.PLAYER_RED_CARD,
        defaults: {
            valence: -60, intensity: 70,
            tags: [EVENT_TAGS.IDOLO, EVENT_TAGS.VERGONHA, EVENT_TAGS.PRESSAO],
            narrativeWeight: 3
        },
        headline: '🟥 Capitão {jogador} é expulso e deixa {clube} desfalcado. Vestiário em silêncio.'
    },
    {
        id: 'red_revolta_torcida',
        type: EVENT_TYPES.PLAYER_RED_CARD,
        defaults: {
            valence: -70, intensity: 75,
            tags: [EVENT_TAGS.VERGONHA, EVENT_TAGS.PRESSAO],
            narrativeWeight: 2
        },
        headline: '🟥 Expulsão de {jogador} revolta torcida do {clube}. Vaias ecoam até o vestiário.'
    },

    // ========================================================================
    // PLAYER_TRANSFER_TO_RIVAL (5 templates)
    // ========================================================================
    {
        id: 'transfer_rival_traicao',
        type: EVENT_TYPES.PLAYER_TRANSFER_TO_RIVAL,
        defaults: {
            valence: -100, intensity: 100,
            tags: [EVENT_TAGS.TRAICAO, EVENT_TAGS.RIVAL_DIRETO, EVENT_TAGS.MIDIATICO],
            narrativeWeight: 5
        },
        headline: '⚠️ {jogador} cruza a linha: do {clube_origem} para o {clube_destino}, no rival mais odiado.'
    },
    {
        id: 'transfer_quebra_promessa',
        type: EVENT_TYPES.PLAYER_TRANSFER_TO_RIVAL,
        defaults: {
            valence: -90, intensity: 90,
            tags: [EVENT_TAGS.TRAICAO, EVENT_TAGS.POLEMICA, EVENT_TAGS.IMPRENSA],
            narrativeWeight: 4
        },
        headline: '⚠️ Beijou a bandeira em {ano_pico}, agora veste a {cor_destino}. {jogador} mata torcida do {clube_origem}.'
    },
    {
        id: 'transfer_outdoor_vergonha',
        type: EVENT_TYPES.PLAYER_TRANSFER_TO_RIVAL,
        defaults: {
            valence: -85, intensity: 85,
            tags: [EVENT_TAGS.TRAICAO, EVENT_TAGS.VERGONHA, EVENT_TAGS.MIDIATICO],
            narrativeWeight: 4
        },
        headline: '⚠️ {jogador} assina com {clube_destino} por {anos} temporadas. Outdoor "Eu fico até morrer" ainda na entrada do CT.'
    },
    {
        id: 'transfer_negociacao_silencio',
        type: EVENT_TYPES.PLAYER_TRANSFER_TO_RIVAL,
        defaults: {
            valence: -75, intensity: 75,
            tags: [EVENT_TAGS.TRAICAO, EVENT_TAGS.IMPRENSA],
            narrativeWeight: 3
        },
        headline: '⚠️ {jogador} fecha com {clube_destino} em silêncio. Diretoria do {clube_origem} é pega de surpresa.'
    },
    {
        id: 'transfer_volta_assobios',
        type: EVENT_TYPES.PLAYER_TRANSFER_TO_RIVAL,
        defaults: {
            valence: -80, intensity: 90,
            tags: [EVENT_TAGS.TRAICAO, EVENT_TAGS.RIVAL_DIRETO, EVENT_TAGS.PRESSAO],
            narrativeWeight: 4
        },
        headline: '⚠️ {jogador} retorna ao estádio do {clube_origem} pela primeira vez vestindo a camisa rival. Assobios eternos.'
    },

    // ========================================================================
    // PLAYER_INJURY_LONG_TERM (4 templates)
    // ========================================================================
    {
        id: 'injury_cruzado_temporada',
        type: EVENT_TYPES.PLAYER_INJURY_LONG_TERM,
        defaults: {
            valence: -80, intensity: 85,
            tags: [EVENT_TAGS.PRESSAO, EVENT_TAGS.SURPRESA],
            narrativeWeight: 3
        },
        headline: '🏥 {jogador} rompe ligamento e está fora por toda a temporada. {clube} sem peça-chave.'
    },
    {
        id: 'injury_recuperacao_lenta',
        type: EVENT_TYPES.PLAYER_INJURY_LONG_TERM,
        defaults: {
            valence: -60, intensity: 65,
            tags: [EVENT_TAGS.PRESSAO],
            narrativeWeight: 2
        },
        headline: '🏥 {jogador} segue na fisioterapia. Retorno previsto pra daqui {weeks} semanas.'
    },
    {
        id: 'injury_idolo_dor',
        type: EVENT_TYPES.PLAYER_INJURY_LONG_TERM,
        defaults: {
            valence: -75, intensity: 80,
            tags: [EVENT_TAGS.IDOLO, EVENT_TAGS.PRESSAO, EVENT_TAGS.MIDIATICO],
            narrativeWeight: 4
        },
        headline: '🏥 Drama: {jogador} sente lesão grave e sai chorando. Ídolo {clube} pode perder finais.'
    },
    {
        id: 'injury_jovem_desafio',
        type: EVENT_TYPES.PLAYER_INJURY_LONG_TERM,
        defaults: {
            valence: -65, intensity: 70,
            tags: [EVENT_TAGS.JOVEM, EVENT_TAGS.PRESSAO],
            narrativeWeight: 3
        },
        headline: '🏥 Jovem {jogador} sofre lesão preocupante. Carreira em risco no {clube}.'
    },

    // ========================================================================
    // PLAYER_RETIRED (4 templates)
    // ========================================================================
    {
        id: 'retire_lenda_eterna',
        type: EVENT_TYPES.PLAYER_RETIRED,
        defaults: {
            valence: 70, intensity: 100,
            tags: [EVENT_TAGS.IDOLO, EVENT_TAGS.MIDIATICO, EVENT_TAGS.LEALDADE],
            narrativeWeight: 5
        },
        headline: '🏆 {jogador} entra para galeria de imortais do {clube}. {gols_carreira} gols em {jogos_carreira}, {titulos} taças, uma vida.'
    },
    {
        id: 'retire_clube_parou',
        type: EVENT_TYPES.PLAYER_RETIRED,
        defaults: {
            valence: 80, intensity: 90,
            tags: [EVENT_TAGS.IDOLO, EVENT_TAGS.MIDIATICO],
            narrativeWeight: 5
        },
        headline: '🏆 O {clube} parou. Aposentadoria de {jogador} é decretada feriado pela torcida no Twitter.'
    },
    {
        id: 'retire_choro_centro',
        type: EVENT_TYPES.PLAYER_RETIRED,
        defaults: {
            valence: 75, intensity: 95,
            tags: [EVENT_TAGS.IDOLO, EVENT_TAGS.LEALDADE, EVENT_TAGS.EPICO],
            narrativeWeight: 5
        },
        headline: '🏆 {anos_de_clube} anos de {clube}. {jogador} se despede chorando no centro do gramado.'
    },
    {
        id: 'retire_silencioso',
        type: EVENT_TYPES.PLAYER_RETIRED,
        defaults: {
            valence: 30, intensity: 50,
            tags: [EVENT_TAGS.VETERANO],
            narrativeWeight: 2
        },
        headline: '🏆 {jogador} pendura as chuteiras em silêncio. Ex-companheiros homenageiam.'
    },

    // ========================================================================
    // PLAYER_CANONIZED (3 templates)
    // ========================================================================
    {
        id: 'canon_idolo_eterno',
        type: EVENT_TYPES.PLAYER_CANONIZED,
        defaults: {
            valence: 100, intensity: 100,
            tags: [EVENT_TAGS.IDOLO, EVENT_TAGS.LEALDADE, EVENT_TAGS.EPICO],
            narrativeWeight: 5
        },
        headline: '👑 {jogador} entra oficialmente pra galeria de ídolos eternos do {clube}. Estátua será inaugurada.'
    },
    {
        id: 'canon_carrasco',
        type: EVENT_TYPES.PLAYER_CANONIZED,
        defaults: {
            valence: 90, intensity: 95,
            tags: [EVENT_TAGS.IDOLO, EVENT_TAGS.RIVAL_DIRETO],
            narrativeWeight: 4
        },
        headline: '👑 {jogador} sela legado como Carrasco do {rival}: {n_gols_classicos} gols em clássicos.'
    },
    {
        id: 'canon_cria_da_base',
        type: EVENT_TYPES.PLAYER_CANONIZED,
        defaults: {
            valence: 95, intensity: 90,
            tags: [EVENT_TAGS.IDOLO, EVENT_TAGS.CRIA_DA_BASE, EVENT_TAGS.LEALDADE],
            narrativeWeight: 5
        },
        headline: '👑 De {nome_categoria_base} pra estátua: {jogador} é canonizado como Cria da Base.'
    },

    // ========================================================================
    // TITLE_WON (5 templates)
    // ========================================================================
    {
        id: 'title_brasileirao',
        type: EVENT_TYPES.TITLE_WON,
        defaults: {
            valence: 100, intensity: 100,
            tags: [EVENT_TAGS.TITULO, EVENT_TAGS.EPICO, EVENT_TAGS.MIDIATICO],
            narrativeWeight: 5
        },
        headline: '🏆 {clube} CAMPEÃO BRASILEIRO! {jogos} jogos, {pontos} pontos, taça pesada na vitrine.'
    },
    {
        id: 'title_libertadores',
        type: EVENT_TYPES.TITLE_WON,
        defaults: {
            valence: 100, intensity: 100,
            tags: [EVENT_TAGS.TITULO, EVENT_TAGS.LIBERTADORES, EVENT_TAGS.EPICO],
            narrativeWeight: 5
        },
        headline: '🏆 LIBERTADORES! {clube} levanta a taça mais cobiçada do continente.'
    },
    {
        id: 'title_estadual_glory',
        type: EVENT_TYPES.TITLE_WON,
        defaults: {
            valence: 70, intensity: 75,
            tags: [EVENT_TAGS.TITULO, EVENT_TAGS.CLASSICO_ESTADUAL],
            narrativeWeight: 3
        },
        headline: '🏆 {clube} bicampeão {estadual}! Ataque exibido em campo aos rivais regionais.'
    },
    {
        id: 'title_copa_brasil',
        type: EVENT_TYPES.TITLE_WON,
        defaults: {
            valence: 90, intensity: 90,
            tags: [EVENT_TAGS.TITULO, EVENT_TAGS.EPICO],
            narrativeWeight: 4
        },
        headline: '🏆 {clube} CAMPEÃO DA COPA DO BRASIL! Jogo épico decidido em {clutch_moment}.'
    },
    {
        id: 'title_acesso',
        type: EVENT_TYPES.TITLE_WON,
        defaults: {
            valence: 80, intensity: 85,
            tags: [EVENT_TAGS.TITULO, EVENT_TAGS.ALIVIO, EVENT_TAGS.MIDIATICO],
            narrativeWeight: 4
        },
        headline: '🏆 {clube} é campeão da Série {div_origem} e sobe pra {div_destino}! Festa nas arquibancadas.'
    },

    // ========================================================================
    // TITLE_LOST_DRAMATICALLY (4 templates)
    // ========================================================================
    {
        id: 'title_lost_final_pen',
        type: EVENT_TYPES.TITLE_LOST_DRAMATICALLY,
        defaults: {
            valence: -100, intensity: 100,
            tags: [EVENT_TAGS.VERGONHA, EVENT_TAGS.PRESSAO, EVENT_TAGS.MIDIATICO],
            narrativeWeight: 5
        },
        headline: '💔 {clube} perde título nos pênaltis aos {minuto}\'. Drama nacional. Choro no vestiário.'
    },
    {
        id: 'title_lost_robbed',
        type: EVENT_TYPES.TITLE_LOST_DRAMATICALLY,
        defaults: {
            valence: -90, intensity: 95,
            tags: [EVENT_TAGS.ARBITRAGEM, EVENT_TAGS.POLEMICA, EVENT_TAGS.MIDIATICO],
            narrativeWeight: 5
        },
        headline: '💔 {clube} é eliminado em jogo polêmico. Imprensa fala em "roubo de título".'
    },
    {
        id: 'title_lost_collapse',
        type: EVENT_TYPES.TITLE_LOST_DRAMATICALLY,
        defaults: {
            valence: -85, intensity: 90,
            tags: [EVENT_TAGS.VERGONHA, EVENT_TAGS.PRESSAO],
            narrativeWeight: 4
        },
        headline: '💔 De {pontos_lider} pontos de vantagem pra perder título no fim. {clube} acumula traumas.'
    },
    {
        id: 'title_lost_para_rival',
        type: EVENT_TYPES.TITLE_LOST_DRAMATICALLY,
        defaults: {
            valence: -100, intensity: 100,
            tags: [EVENT_TAGS.VERGONHA, EVENT_TAGS.RIVAL_DIRETO, EVENT_TAGS.PRESSAO],
            narrativeWeight: 5
        },
        headline: '💔 {clube} perde título justamente pro {rival}. Trauma geracional. Torcida em luto.'
    },

    // ========================================================================
    // DERBY_VICTORY (5 templates)
    // ========================================================================
    {
        id: 'derby_win_classic',
        type: EVENT_TYPES.DERBY_VICTORY,
        defaults: {
            valence: 80, intensity: 85,
            tags: [EVENT_TAGS.RIVAL_DIRETO, EVENT_TAGS.EPICO],
            narrativeWeight: 3
        },
        headline: '⚽ {clube} {gols_pro} x {gols_contra} {rival}. Clássico nos braços do alvinegro.'
    },
    {
        id: 'derby_win_goleada',
        type: EVENT_TYPES.DERBY_VICTORY,
        defaults: {
            valence: 95, intensity: 95,
            tags: [EVENT_TAGS.RIVAL_DIRETO, EVENT_TAGS.EPICO, EVENT_TAGS.MIDIATICO],
            narrativeWeight: 4
        },
        headline: '⚽ {clube} GOLEIA {rival} {gols_pro} a {gols_contra}! Massacre histórico.'
    },
    {
        id: 'derby_win_virada',
        type: EVENT_TYPES.DERBY_VICTORY,
        defaults: {
            valence: 90, intensity: 95,
            tags: [EVENT_TAGS.RIVAL_DIRETO, EVENT_TAGS.EPICO, EVENT_TAGS.SURPRESA],
            narrativeWeight: 4
        },
        headline: '⚽ Perdendo de {gols_contra}, {clube} vira pra {gols_pro} contra {rival}! Resgate épico.'
    },
    {
        id: 'derby_win_carrasco',
        type: EVENT_TYPES.DERBY_VICTORY,
        defaults: {
            valence: 85, intensity: 90,
            tags: [EVENT_TAGS.RIVAL_DIRETO, EVENT_TAGS.IDOLO],
            narrativeWeight: 3
        },
        headline: '⚽ {jogador} repete dose: marca contra {rival} pelo {n}º clássico. Carrasco confirmado.'
    },
    {
        id: 'derby_win_silencio',
        type: EVENT_TYPES.DERBY_VICTORY,
        defaults: {
            valence: 75, intensity: 80,
            tags: [EVENT_TAGS.RIVAL_DIRETO, EVENT_TAGS.ALIVIO],
            narrativeWeight: 3
        },
        headline: '⚽ {clube} silencia o estádio do {rival} com vitória apertada. Pressão aliviada.'
    },

    // ========================================================================
    // DERBY_DEFEAT (5 templates)
    // ========================================================================
    {
        id: 'derby_loss_humilhacao',
        type: EVENT_TYPES.DERBY_DEFEAT,
        defaults: {
            valence: -90, intensity: 90,
            tags: [EVENT_TAGS.RIVAL_DIRETO, EVENT_TAGS.VERGONHA],
            narrativeWeight: 4
        },
        headline: '💔 {rival} {gols_contra} x {gols_pro} {clube}. Humilhação no clássico. Torcida revoltada.'
    },
    {
        id: 'derby_loss_3_seguidas',
        type: EVENT_TYPES.DERBY_DEFEAT,
        defaults: {
            valence: -85, intensity: 85,
            tags: [EVENT_TAGS.RIVAL_DIRETO, EVENT_TAGS.VERGONHA, EVENT_TAGS.PRESSAO],
            narrativeWeight: 4
        },
        headline: '💔 {clube} perde {n}ª seguida pro {rival}. Pesadelo continua.'
    },
    {
        id: 'derby_loss_walkover',
        type: EVENT_TYPES.DERBY_DEFEAT,
        defaults: {
            valence: -80, intensity: 80,
            tags: [EVENT_TAGS.RIVAL_DIRETO, EVENT_TAGS.VERGONHA, EVENT_TAGS.MIDIATICO],
            narrativeWeight: 3
        },
        headline: '💔 {clube} mal jogou. {rival} dominou e venceu sem dificuldade. Imprensa cobra.'
    },
    {
        id: 'derby_loss_traidor',
        type: EVENT_TYPES.DERBY_DEFEAT,
        defaults: {
            valence: -100, intensity: 100,
            tags: [EVENT_TAGS.RIVAL_DIRETO, EVENT_TAGS.TRAICAO, EVENT_TAGS.VERGONHA],
            narrativeWeight: 5
        },
        headline: '💔 {ex_jogador} marca contra ex-clube no clássico. Trauma multiplicado.'
    },
    {
        id: 'derby_loss_protesto',
        type: EVENT_TYPES.DERBY_DEFEAT,
        defaults: {
            valence: -85, intensity: 85,
            tags: [EVENT_TAGS.VERGONHA, EVENT_TAGS.PRESSAO],
            narrativeWeight: 4
        },
        headline: '💔 Torcida do {clube} protesta após derrota pro {rival}. Cobrança no CT.'
    },

    // ========================================================================
    // TORCIDA_PROTEST (4 templates)
    // ========================================================================
    {
        id: 'protest_faixas',
        type: EVENT_TYPES.TORCIDA_PROTEST,
        defaults: {
            valence: -75, intensity: 75,
            tags: [EVENT_TAGS.PRESSAO, EVENT_TAGS.MIDIATICO],
            narrativeWeight: 3
        },
        headline: '📢 Torcida pendura faixa: "{slogan_protesto}". Pressão sobre diretoria do {clube}.'
    },
    {
        id: 'protest_ct_invasao',
        type: EVENT_TYPES.TORCIDA_PROTEST,
        defaults: {
            valence: -90, intensity: 90,
            tags: [EVENT_TAGS.PRESSAO, EVENT_TAGS.VERGONHA, EVENT_TAGS.MIDIATICO],
            narrativeWeight: 4
        },
        headline: '📢 Organizada do {clube} invade CT. Crise instalada após série de resultados ruins.'
    },
    {
        id: 'protest_internet_viral',
        type: EVENT_TYPES.TORCIDA_PROTEST,
        defaults: {
            valence: -60, intensity: 65,
            tags: [EVENT_TAGS.PRESSAO, EVENT_TAGS.MIDIATICO],
            narrativeWeight: 2
        },
        headline: '📢 Hashtag #{slogan_hashtag} viraliza. Torcedores cobram diretoria via redes.'
    },
    {
        id: 'protest_silencio_estadio',
        type: EVENT_TYPES.TORCIDA_PROTEST,
        defaults: {
            valence: -70, intensity: 70,
            tags: [EVENT_TAGS.PRESSAO],
            narrativeWeight: 3
        },
        headline: '📢 Estádio em silêncio simbólico. Torcida do {clube} se cala em protesto.'
    },

    // ========================================================================
    // PRESIDENT_CONFRONTATION (5 templates)
    // ========================================================================
    {
        id: 'pres_ultimato_publico',
        type: EVENT_TYPES.PRESIDENT_CONFRONTATION,
        defaults: {
            valence: -80, intensity: 80,
            tags: [EVENT_TAGS.PRESSAO, EVENT_TAGS.MIDIATICO],
            narrativeWeight: 4
        },
        headline: '⚠️ Presidente {presidente} dá ultimato a {manager}: "até a {n_jogo}ª rodada ou cai".'
    },
    {
        id: 'pres_reuniao_silencio',
        type: EVENT_TYPES.PRESIDENT_CONFRONTATION,
        defaults: {
            valence: -50, intensity: 60,
            tags: [EVENT_TAGS.PRESSAO, EVENT_TAGS.IMPRENSA],
            narrativeWeight: 2
        },
        headline: '⚠️ Reunião de {duracao}h no {nome_local}. {manager} sai sem dar entrevista, presidente diz "está tudo certo". Está?'
    },
    {
        id: 'pres_cobranca_tactica',
        type: EVENT_TYPES.PRESIDENT_CONFRONTATION,
        defaults: {
            valence: -40, intensity: 50,
            tags: [EVENT_TAGS.PRESSAO],
            narrativeWeight: 2
        },
        headline: '⚠️ Presidente {presidente} cobra mudança tática. {manager} responde: "decisão é minha".'
    },
    {
        id: 'pres_apoiador_publico',
        type: EVENT_TYPES.PRESIDENT_CONFRONTATION,
        defaults: {
            valence: 60, intensity: 65,
            tags: [EVENT_TAGS.MIDIATICO, EVENT_TAGS.IMPRENSA],
            narrativeWeight: 2
        },
        headline: '✅ Presidente {presidente} dá voto de confiança a {manager}: "ele vai virar".'
    },
    {
        id: 'pres_demissao',
        type: EVENT_TYPES.PRESIDENT_CONFRONTATION,
        defaults: {
            valence: -100, intensity: 100,
            tags: [EVENT_TAGS.PRESSAO, EVENT_TAGS.MIDIATICO, EVENT_TAGS.VERGONHA],
            narrativeWeight: 5
        },
        headline: '⚠️ {manager} é demitido após reunião com {presidente}. {n_jogos} jogos, {n_v}V {n_e}E {n_d}D.'
    },

    // ========================================================================
    // STAFF_HIRED (3 templates)
    // ========================================================================
    {
        id: 'staff_hire_estrela',
        type: EVENT_TYPES.STAFF_HIRED,
        defaults: {
            valence: 60, intensity: 60,
            tags: [EVENT_TAGS.MIDIATICO, EVENT_TAGS.IMPRENSA],
            narrativeWeight: 2
        },
        headline: '👥 {clube} contrata {staff_role} de prestígio. Aposta em melhoria operacional.'
    },
    {
        id: 'staff_hire_polemico',
        type: EVENT_TYPES.STAFF_HIRED,
        defaults: {
            valence: 30, intensity: 50,
            tags: [EVENT_TAGS.POLEMICA, EVENT_TAGS.IMPRENSA],
            narrativeWeight: 2
        },
        headline: '👥 Contratação polêmica: novo {staff_role} já trabalhou no {clube_rival}. Imprensa questiona.'
    },
    {
        id: 'staff_hire_silencioso',
        type: EVENT_TYPES.STAFF_HIRED,
        defaults: {
            valence: 20, intensity: 30,
            tags: [],
            narrativeWeight: 1
        },
        headline: '👥 {clube} apresenta novo {staff_role} sem alarde. Foco em resultados.'
    },

    // ========================================================================
    // STAFF_FIRED (3 templates)
    // ========================================================================
    {
        id: 'staff_fire_resultados',
        type: EVENT_TYPES.STAFF_FIRED,
        defaults: {
            valence: -50, intensity: 60,
            tags: [EVENT_TAGS.PRESSAO],
            narrativeWeight: 2
        },
        headline: '👥 {clube} demite {staff_role} após sequência negativa. Vestiário em transformação.'
    },
    {
        id: 'staff_fire_briga_publica',
        type: EVENT_TYPES.STAFF_FIRED,
        defaults: {
            valence: -70, intensity: 75,
            tags: [EVENT_TAGS.POLEMICA, EVENT_TAGS.MIDIATICO, EVENT_TAGS.IMPRENSA],
            narrativeWeight: 3
        },
        headline: '👥 {staff_role} é demitido após briga pública. Bastidores azedam no {clube}.'
    },
    {
        id: 'staff_fire_corte_orcamento',
        type: EVENT_TYPES.STAFF_FIRED,
        defaults: {
            valence: -40, intensity: 50,
            tags: [],
            narrativeWeight: 1
        },
        headline: '👥 Corte de gastos: {clube} dispensa {staff_role}. Diretoria justifica.'
    },

    // ========================================================================
    // TACTIC_CHANGED_DRAMATICALLY (3 templates)
    // ========================================================================
    {
        id: 'tactic_radical_change',
        type: EVENT_TYPES.TACTIC_CHANGED_DRAMATICALLY,
        defaults: {
            valence: 0, intensity: 60,
            tags: [EVENT_TAGS.SURPRESA, EVENT_TAGS.IMPRENSA],
            narrativeWeight: 2
        },
        headline: '📋 {manager} muda tudo: {tatica_antiga} → {tatica_nova} no {clube}. Time vai responder?'
    },
    {
        id: 'tactic_emergency',
        type: EVENT_TYPES.TACTIC_CHANGED_DRAMATICALLY,
        defaults: {
            valence: -20, intensity: 70,
            tags: [EVENT_TAGS.PRESSAO, EVENT_TAGS.SURPRESA],
            narrativeWeight: 3
        },
        headline: '📋 Mudança tática emergencial: {manager} adota {tatica_nova} após {n_derrotas} derrotas seguidas.'
    },
    {
        id: 'tactic_master_class',
        type: EVENT_TYPES.TACTIC_CHANGED_DRAMATICALLY,
        defaults: {
            valence: 70, intensity: 80,
            tags: [EVENT_TAGS.SURPRESA, EVENT_TAGS.MILAGRE, EVENT_TAGS.MIDIATICO],
            narrativeWeight: 3
        },
        headline: '📋 Aula tática! {manager} surpreende com {tatica_nova} e domina {rival}. Imprensa rasga elogios.'
    }
]);

// Total: 8+5+5+4+4+3+5+4+5+5+4+5+3+3+3 = 76 templates
// (4 templates a serem expandidos em v1.0.7.1 ou v1.1)

/**
 * Lookup template by id.
 */
export function getEventTemplate(id) {
    return EVENT_TEMPLATES.find(t => t.id === id) || null;
}

/**
 * Get all templates of a given event type.
 */
export function getTemplatesByType(eventType) {
    return EVENT_TEMPLATES.filter(t => t.type === eventType);
}

/**
 * Pick random template by event type (with optional rng).
 */
export function pickRandomTemplate(eventType, rng = Math.random) {
    const pool = getTemplatesByType(eventType);
    if (pool.length === 0) return null;
    return pool[Math.floor(rng() * pool.length)];
}

export const TEMPLATES_COUNT = EVENT_TEMPLATES.length;
