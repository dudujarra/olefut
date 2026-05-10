/**
 * ChronicleSystem — SPEC-082: Crônica do Save
 *
 * Prosa narrativa por temporada. Template-driven, sem LLM.
 * Interpolação de dados reais do save (arcos, títulos, vexames, rivalidades).
 *
 * Stateless: recebe dados da season, retorna texto.
 */

const TEMPLATES = {
    title: [
        'Uma temporada inesquecível. {club} conquistou {title} e escreveu seu nome na história.',
        'O técnico {manager} levou {club} ao topo com {title}. A torcida não vai esquecer.',
    ],
    promotion: [
        '{club} subiu para {nextDivision}. O trabalho de reconstrução começa a dar frutos.',
        'Temporada de superação: {club} conseguiu o acesso tão esperado.',
    ],
    relegation: [
        'Ano difícil para {club}. O rebaixamento é amargo, mas o caminho de volta começa agora.',
        'A temporada terminou da pior forma: {club} desceu para {nextDivision}.',
    ],
    vexame: [
        'O {score} contra {opponent} ainda dói. Mas o técnico sobreviveu e prometeu resposta.',
        'Vexame histórico na temporada — {score}. O clube precisará esquecer para seguir em frente.',
    ],
    solid: [
        'Temporada sólida de {club}: {wins} vitórias, {position}º lugar. Base para crescer.',
        '{club} terminou em {position}º. Sem títulos, mas com consistência que constrói futuros.',
    ],
    neutral: [
        'Mais uma temporada no roteiro do {club}. O trabalho continua.',
    ],
};

/**
 * Gera crônica narrativa de uma temporada.
 *
 * @param {object} opts
 * @param {number} opts.season
 * @param {string} opts.clubName
 * @param {string} opts.managerName
 * @param {object} opts.seasonData
 * @returns {{ season, chronicle: string, mood: string }}
 */
export function generate({ season = 1, clubName = 'Clube', managerName = 'Técnico', seasonData = {} } = {}) {
    const {
        finalPosition = 10,
        titlesWon = [],
        relegationOccurred = false,
        promotionOccurred = false,
        worstLoss = null,
        wins = 0,
        totalTeams = 20,
    } = seasonData;

    let template;
    let mood;
    let vars = { club: clubName, manager: managerName, wins, position: finalPosition };

    if (titlesWon.length > 0) {
        template = pick(TEMPLATES.title);
        vars.title = titlesWon[0];
        mood = 'triumph';
    } else if (promotionOccurred) {
        template = pick(TEMPLATES.promotion);
        vars.nextDivision = 'divisão superior';
        mood = 'rise';
    } else if (relegationOccurred) {
        template = pick(TEMPLATES.relegation);
        vars.nextDivision = 'divisão inferior';
        mood = 'fall';
    } else if (worstLoss && worstLoss.diff >= 4) {
        template = pick(TEMPLATES.vexame);
        vars.score = worstLoss.score || '0-4';
        vars.opponent = worstLoss.opponent || 'adversário';
        mood = 'shame';
    } else if (finalPosition <= Math.ceil(totalTeams * 0.4)) {
        template = pick(TEMPLATES.solid);
        mood = 'solid';
    } else {
        template = pick(TEMPLATES.neutral);
        mood = 'neutral';
    }

    const chronicle = interpolate(template, vars);

    return { season, chronicle, mood };
}

// ─── helpers ────────────────────────────────────────────────

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function interpolate(template, vars) {
    return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] !== undefined ? vars[key] : `{${key}}`);
}
