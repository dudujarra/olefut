/**
 * MidMatchManagerDeck — SPEC-B2
 *
 * Catálogo de 8 cartas de decisão mid-match para modo Manager.
 * Gatilho em minutos 15/30/45/60/75 com chance probabilística.
 *
 * Pure module. Helpers determinísticos via seed.
 */

export const MidMatchManagerDeck = [
    {
        id: 'mid_press_high',
        minuteRange: [15, 30],
        text: 'Adversário tá segurando posse. Torcida pede pressão.',
        options: [
            { label: 'Subir linha e pressionar', effect: { moralDelta: 5, energyDelta: -10, tacticShift: 'pressing' }, resultText: 'Time sobe, sufoca a saída.' },
            { label: 'Manter postura', effect: { moralDelta: 0, energyDelta: 0 }, resultText: 'Mantém o plano.' },
            { label: 'Recuar e contra-atacar', effect: { moralDelta: -2, tacticShift: 'counter' }, resultText: 'Espera a brecha. Torcida vaia.' },
        ],
    },
    {
        id: 'mid_player_tired',
        minuteRange: [30, 45],
        text: 'Lateral parece exausto. Marcação caindo.',
        options: [
            { label: 'Pedir substituição', effect: { energyDelta: 5, moralDelta: 2 }, resultText: 'Banco esquenta. Reserva entra ágil.' },
            { label: 'Mandar segurar até intervalo', effect: { energyDelta: -8 }, resultText: 'Aguenta, mas no limite.' },
            { label: 'Mudar formação pra cobrir', effect: { tacticShift: 'defensive' }, resultText: 'Linha defensiva ajustada.' },
        ],
    },
    {
        id: 'mid_referee_tense',
        minuteRange: [45, 60],
        text: 'Arbitragem polêmica. Time reclamando demais.',
        options: [
            { label: 'Acalmar a galera', effect: { moralDelta: 3 }, resultText: 'Capitão chama pra ordem.' },
            { label: 'Reclamar do banco', effect: { moralDelta: -3 }, resultText: 'Quarto árbitro adverte você.' },
            { label: 'Ignorar e focar', effect: { moralDelta: 1, energyDelta: -2 }, resultText: 'Time joga, briga é depois.' },
        ],
    },
    {
        id: 'mid_attack_chance',
        minuteRange: [60, 75],
        text: 'Adversário cansou. Espaço pra crescer no ataque.',
        options: [
            { label: 'Tirar volante, botar atacante', effect: { tacticShift: 'offensive', moralDelta: 4 }, resultText: 'All-in. Vai pra cima.' },
            { label: 'Manter equilíbrio', effect: { moralDelta: 0 }, resultText: 'Não arrisca o que tem.' },
            { label: 'Pressing localizado no terço final', effect: { energyDelta: -10, tacticShift: 'pressing' }, resultText: 'Time sufoca no campo deles.' },
        ],
    },
    {
        id: 'mid_losing_pressure',
        minuteRange: [60, 75],
        text: 'Tá perdendo. Torcida agitada. Banco apreensivo.',
        options: [
            { label: 'Mudar tudo: ataque total', effect: { tacticShift: 'offensive', moralDelta: 5, energyDelta: -12 }, resultText: 'Resto da partida é tudo ou nada.' },
            { label: 'Aguardar erro adversário', effect: { moralDelta: -3 }, resultText: 'Passivo. Tribuna não gosta.' },
            { label: 'Falar com capitão na lateral', effect: { moralDelta: 6 }, resultText: 'Capitão repassa mensagem. Time reage.' },
        ],
    },
    {
        id: 'mid_winning_protect',
        minuteRange: [60, 75],
        text: 'Tá ganhando. Adversário no desespero, vai pro tudo.',
        options: [
            { label: 'Travar atrás (Defensivo)', effect: { tacticShift: 'defensive', moralDelta: -1 }, resultText: 'Linha baixa. Sofrendo mas segurando.' },
            { label: 'Sair em contra-ataque', effect: { tacticShift: 'counter', moralDelta: 3 }, resultText: 'Explora o desespero deles.' },
            { label: 'Gestão de bola (Posse)', effect: { tacticShift: 'possession', energyDelta: -3 }, resultText: 'Mata o jogo com toques.' },
        ],
    },
    {
        id: 'mid_yellow_warning',
        minuteRange: [30, 60],
        text: 'Volante já tem amarelo. Próxima falta = expulsão.',
        options: [
            { label: 'Substituir preventivo', effect: { moralDelta: 2, energyDelta: 3 }, resultText: 'Sai forte, entra fresco.' },
            { label: 'Avisar pra pegar leve', effect: { moralDelta: 0 }, resultText: 'Capitão repassa. Cuidado nas divididas.' },
            { label: 'Manter no ritmo', effect: { moralDelta: -2 }, resultText: 'Risco de ficar com 10. Você jogou no escuro.' },
        ],
    },
    {
        id: 'mid_set_piece_chance',
        minuteRange: [45, 75],
        text: 'Falta perigosa, na entrada da área. Quem bate?',
        options: [
            { label: 'Especialista direto no gol', effect: { moralDelta: 3 }, resultText: 'Bate na barreira. Mantém pressão.' },
            { label: 'Jogada ensaiada de cruzamento', effect: { moralDelta: 2 }, resultText: 'Cabeçada na trave.' },
            { label: 'Tocar curto pra construção', effect: { moralDelta: 0 }, resultText: 'Inteligente, cadenciado.' },
        ],
    },
];

const VALID_TRIGGER_MINUTES = new Set([15, 30, 45, 60, 75]);

/**
 * Pure: determina se um minuto é elegível para card trigger.
 * Não decide probabilidade — caller aplica RNG externa.
 *
 * @param {number} minute
 * @param {Set<number>} [alreadyTriggered] — minutos já consumidos
 * @returns {boolean}
 */
export function shouldTriggerMidMatch(minute, alreadyTriggered = new Set()) {
    if (!VALID_TRIGGER_MINUTES.has(minute)) return false;
    if (alreadyTriggered.has(minute)) return false;
    return true;
}

/**
 * Pure: seleciona carta candidata para um minuto via seed.
 * Filtra deck por minuteRange + escolhe via modular seed.
 *
 * @param {number} minute
 * @param {number} seed
 * @returns {object|null}
 */
export function getMidMatchCard(minute, seed = 0) {
    const candidates = MidMatchManagerDeck.filter(c => {
        const [lo, hi] = c.minuteRange;
        return minute >= lo && minute <= hi;
    });
    if (candidates.length === 0) return null;
    const idx = Math.abs(seed) % candidates.length;
    return candidates[idx];
}

export { VALID_TRIGGER_MINUTES };
