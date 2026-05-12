/**
 * BrazilianAtmosphere — SPEC-B6
 *
 * Camada cosmética de brasilianidade para match events.
 * Catálogo de 30+ frases PT-BR contextuais.
 *
 * Pure function. Determinístico (seed-based).
 */

const ATMOSPHERE = {
    goal: [
        'O Maracanã treme com a vibração da torcida.',
        'A camisa 10 ergue os braços, o povo grita.',
        'Estádio em silêncio antes da explosão.',
        'Beira de campo vira festa, banco no abraço coletivo.',
        'A virada começou — ou foi confirmada.',
        'Bola na rede, comando já comemorando antes do juiz validar.',
        'Tarde de sol e gol — combinação perfeita.',
        'A geral pula em uníssono, a arquibancada chora junto.',
    ],
    goal_home: [
        'Pacaembu pega fogo, a casa marcou.',
        'Beira-Rio explode, gol em casa.',
        'A torcida da Vila grita junto, cada lance vibrado.',
    ],
    goal_away: [
        'Visitante calou o estádio adversário.',
        'Gol fora de casa pesa o dobro — quem joga sabe.',
        'Banco visitante invade o gramado, gritaria contida na arquibancada anfitriã.',
    ],
    card: [
        'Cartão amarelo no peito, técnico no banco já discutindo com o quarto árbitro.',
        'Falta dura, torcida adversária pede vermelho.',
        'Juiz mostra cartão, jogada que vinha boa fica truncada.',
        'Amarelo merecido. Próxima falta pode ser expulsão.',
        'Reclamação geral, mas o cartão é claro.',
    ],
    red_card: [
        'Expulsão! Time vira chave, vai pro tudo ou nada com um a menos.',
        'Vermelho direto. Comando ainda discute com o quarto árbitro.',
        'A imprensa amanhã vai falar mais da expulsão que do jogo.',
        'Estádio dividido entre revolta e festa.',
    ],
    miss: [
        'Cara a cara, mas a bola saiu chorando pela linha de fundo.',
        'Atacante já comemorava — tarde para reagir.',
        'Trave salva o adversário, sorte que nem se brinca.',
        'O goleiro nem se mexeu, a bola pediu desculpa pra trave.',
    ],
    save: [
        'Defesa milagrosa! Torcida aplaude de pé.',
        'O goleiro voou no canto, pegou o impossível.',
        'Reflexo de gente grande. Salvou o time.',
        'Quase gol — a luva foi mais rápida.',
    ],
    derby: [
        'Clássico é clássico — não se compara com nenhuma outra partida.',
        'O Brasileirão para — derby tem regra própria.',
        'Bandeira do rival queima no setor oposto. A mística pede vitória.',
        'Cada lance vale o dobro. Cada pisada é histórica.',
        'A geral lembra de cada lance dos clássicos passados.',
    ],
    late_drama: [
        'Últimos minutos, tudo se decide aqui.',
        'Pressão final. Quem tiver coração maior vence.',
        'Acréscimos viraram batalha campal pela bola.',
        'Cronômetro corre contra um, voa contra outro.',
        'Estádio em pé. Cada toque vale ouro.',
        'Banco em pé desde os 80. Tensão pura.',
    ],
    // SPEC-F3.2: expansão pra 200+
    pre_match: [
        'Hino executado. Bandeirinhas hasteadas. Hora do jogo.',
        'Aquecimento da torcida. Cantos ressoam pelo estádio.',
        'Times entram em campo. Imprensa posicionada.',
        'Capitães se cumprimentam no centro. Moeda no ar.',
        'Atmosfera carregada de expectativa. Tudo pronto.',
        'Tribuna lotada. Câmeras ligadas. Apito iminente.',
    ],
    corner: [
        'Escanteio cobrado com perigo. Linha defensiva ajustando.',
        'Bola na área, marcação por homem desorganizada.',
        'Cruzamento com força, defesa afastou no susto.',
        'Cobrança curta surpreende a marcação.',
        'Atacante alto pulou primeiro, mas cabeceou pra fora.',
    ],
    freekick: [
        'Falta perigosa. Especialista preparando a cobrança.',
        'Barreira posicionada. Goleiro orientando.',
        'Cobrança rasteira buscando o canto.',
        'Bola na barreira. Rebote arriscado.',
        'Falta na entrada da área. Tudo pode acontecer.',
    ],
    penalty: [
        'Pênalti! Estádio inteiro em silêncio.',
        'Bola no ponto de cal. Goleiro encarando o batedor.',
        'Cobrança decisiva. Carreira pode mudar aqui.',
        'Pernas tremem. Multidão sustenta a respiração.',
    ],
    injury: [
        'Jogador caído. Médico entra apressado.',
        'Lesão preocupante. Time pede substituição.',
        'Maca chega ao gramado. Adversários respeitam.',
        'Companheiros ajoelhados. Torcida aplaude na saída.',
    ],
    substitution: [
        'Placa de substituição erguida. Mudança estratégica.',
        'Reserva entra com aplausos. Titular sai cansado.',
        'Comando faz alteração tática. Vamos ver o impacto.',
        'Frescor novo no campo. Adversário precisa se reajustar.',
    ],
    halftime: [
        'Intervalo no Brasileirão. Vestiários fervendo.',
        'Times entram pro descanso. Treinadores no quadro tático.',
        'Pausa curta. Repos imediato.',
        '15 minutos pra ajustar. Segundo tempo decide.',
    ],
    final_whistle: [
        'Apito final! Time da casa explode em festa.',
        'Fim de jogo. Resultado consumado.',
        'Cumprimentos finais. Torcida começa a deixar o estádio.',
        'Imprensa corre pra entrevista pós-jogo.',
        'Estádio aplaude a entrega. Resultado é justo.',
    ],
    season_end: [
        'Fim de temporada. Brasileirão entra pra história.',
        'Última rodada. Pódio definido.',
        'Torcida canta o adeus a temporada.',
        'Estatísticas finais sendo computadas pela imprensa.',
    ],
    // SPEC-F3.4: regional weather flavor
    weather_north_hot: [
        'Calor de 38° em Manaus. Time bebe água a cada parada.',
        'Sol do norte castiga. Energia drena rápido.',
        'Umidade alta da Amazônia. Bola pesa mais que normal.',
    ],
    weather_central_rain: [
        'Lama em Cuiabá. Bola não rola, pula imprevisível.',
        'Tempestade Centro-Oeste. Gramado virou poça.',
        'Visibilidade ruim. Lances de surpresa em todo passe.',
    ],
    weather_south_cold: [
        'Frio de Porto Alegre. Atletas vapor saindo da boca.',
        'Vento sul cortante. Bola sofre desvios estranhos.',
        'Gramado duro do inverno gaúcho. Cuidado nas divididas.',
    ],
    weather_se_classic: [
        'Tarde ensolarada no Maracanã. Cenário perfeito pra clássico.',
        'Chuva carioca de verão. Bola cortando água nas jogadas.',
        'Sereno de inverno em São Paulo. Atmosfera densa.',
    ],
    weather_ne_warm: [
        'Brisa litorânea em Recife. Calor abafado mas suportável.',
        'Tarde quente em Salvador. Torcida só de bermuda.',
        'Sol forte em Fortaleza. Hidratação obrigatória.',
    ],
};

const ALL_EVENT_TYPES = Object.keys(ATMOSPHERE);

/**
 * Retorna frase atmosférica determinística por seed.
 *
 * @param {string} eventType — chave de ATMOSPHERE
 * @param {number} seed — número inteiro para determinismo
 * @returns {{ flavorString: string, category: string }}
 */
export function getAtmosphere(eventType, seed = 0) {
    const list = ATMOSPHERE[eventType];
    if (!list || list.length === 0) {
        return { flavorString: '', category: 'unknown' };
    }
    const idx = Math.abs(seed) % list.length;
    return { flavorString: list[idx], category: eventType };
}

/**
 * Retorna múltiplas frases (sem repetir) — útil pra montagem narrativa.
 *
 * @param {string} eventType
 * @param {number} count
 * @param {number} seed
 * @returns {string[]}
 */
export function getAtmosphereSet(eventType, count = 3, seed = 0) {
    const list = ATMOSPHERE[eventType] || [];
    if (list.length === 0) return [];
    const result = [];
    const used = new Set();
    let cursor = Math.abs(seed) % list.length;
    while (result.length < count && result.length < list.length) {
        if (!used.has(cursor)) {
            result.push(list[cursor]);
            used.add(cursor);
        }
        cursor = (cursor + 1) % list.length;
    }
    return result;
}

export { ATMOSPHERE, ALL_EVENT_TYPES };
