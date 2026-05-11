/* eslint-disable no-unused-vars */
/**
 * SPEC-150: Season Story Engine — gera resumo narrativo de cada temporada.
 * AUDIT-FIX #G: Adicionado sistema de arcos inter-temporada.
 */
export function generateSeasonStory({ wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0,
    topScorer = null, longestWinStreak = 0, biggestWin = null, worstLoss = null,
    position = 10, promoted = false, relegated = false, division = 1, seasonNumber = 1,
    previousStories = [] } = {}) {

    const record = `${wins}V ${draws}E ${losses}D`;
    const mood = (promoted && wins >= 20) ? 'epic'
        : relegated ? 'tragic'
        : position <= 3 ? 'great'
        : position >= 17 ? 'survival'
        : 'mediocre';

    // ── AUDIT-FIX #G: Inter-season arc detection ──────────────
    const arc = detectArc(previousStories, mood, division, position, seasonNumber);

    let headline;
    if (arc.active) {
        // Use arc narrative instead of generic headline
        headline = arc.headline;
    } else if (promoted && wins >= 20) {
        const divNames = ['', 'Série A', 'Série B', 'Série C', 'Série D'];
        headline = `Campeão! Promovido para ${divNames[division - 1] || 'divisão acima'} com ${wins} vitórias`;
    } else if (promoted) {
        headline = `Promovido! ${wins}V na temporada`;
    } else if (relegated) {
        headline = `Rebaixado após temporada difícil (${wins}V ${losses}D)`;
    } else if (longestWinStreak >= 8) {
        headline = `Sequência histórica de ${longestWinStreak} vitórias seguidas`;
    } else if (biggestWin?.diff >= 4) {
        headline = `Goleada memorável de ${biggestWin.score}`;
    } else {
        headline = `Temporada ${position}º — ${wins}V ${draws}E ${losses}D`;
    }

    const scorerText = topScorer?.goals > 0
        ? `${topScorer.name} — ${topScorer.goals} gols`
        : null;

    const moment = longestWinStreak >= 5
        ? `Sequência de ${longestWinStreak} vitórias`
        : (worstLoss?.diff >= 4 ? `Goleada sofrida: ${worstLoss.score}` : null);

    return { headline, topScorer: scorerText, record, moment, mood, season: seasonNumber, arc: arc.name || null };
}

/**
 * AUDIT-FIX #G: Detect multi-season narrative arcs.
 * Tracks patterns across previous seasons and generates contextual headlines.
 */
function detectArc(previousStories, currentMood, division, position, season) {
    if (!previousStories || previousStories.length < 2) {
        return { active: false };
    }

    const recent = previousStories.slice(-5);

    // ── ARC: DYNASTY (3+ consecutive good/epic seasons) ──────
    const consecutiveGood = countConsecutiveFromEnd(recent, s => s.mood === 'great' || s.mood === 'epic');
    if (consecutiveGood >= 2 && (currentMood === 'great' || currentMood === 'epic')) {
        const years = consecutiveGood + 1;
        return {
            active: true,
            name: 'DYNASTY',
            headline: `🏛️ ${years}ª temporada consecutiva no topo — a DINASTIA continua!`
        };
    }

    // ── ARC: REBUILDING (2+ mediocre/survival after tragic) ──
    const hadTragic = recent.some(s => s.mood === 'tragic');
    const recentMediocre = countConsecutiveFromEnd(recent, s => s.mood === 'mediocre' || s.mood === 'survival');
    if (hadTragic && recentMediocre >= 1 && (currentMood === 'mediocre' || currentMood === 'survival')) {
        const years = recentMediocre + 1;
        return {
            active: true,
            name: 'REBUILDING',
            headline: `🔨 Ano ${years} de reconstrução — o projeto começa a tomar forma`
        };
    }

    // ── ARC: PHOENIX (great/epic season right after tragic) ──
    const lastMood = recent[recent.length - 1]?.mood;
    if (lastMood === 'tragic' && (currentMood === 'great' || currentMood === 'epic')) {
        return {
            active: true,
            name: 'PHOENIX',
            headline: `🔥 RENASCIMENTO! Da humilhação ao topo em uma temporada!`
        };
    }

    // ── ARC: YO-YO (alternating tragic/great moods) ──────────
    if (recent.length >= 3) {
        const pattern = recent.slice(-3).map(s => s.mood);
        const isYoyo = (pattern[0] === 'tragic' && pattern[1] === 'great' && currentMood === 'tragic') ||
                       (pattern[0] === 'great' && pattern[1] === 'tragic' && currentMood === 'great');
        if (isYoyo) {
            return {
                active: true,
                name: 'YOYO',
                headline: `🎢 O ELEVADOR não para — mais uma temporada na montanha-russa!`
            };
        }
    }

    // ── ARC: UNDERDOG CLIMB (steadily improving position) ────
    if (recent.length >= 2) {
        const improving = recent.every((s, i) => {
            if (i === 0) return true;
            // mood order: tragic < survival < mediocre < great < epic
            const moodOrder = { tragic: 0, survival: 1, mediocre: 2, great: 3, epic: 4 };
            return (moodOrder[s.mood] || 0) >= (moodOrder[recent[i-1].mood] || 0);
        });
        const currentOrder = { tragic: 0, survival: 1, mediocre: 2, great: 3, epic: 4 };
        if (improving && (currentOrder[currentMood] || 0) > (currentOrder[recent[recent.length - 1]?.mood] || 0)) {
            return {
                active: true,
                name: 'UNDERDOG',
                headline: `📈 A escalada continua! ${season}ª temporada de progresso constante!`
            };
        }
    }

    return { active: false };
}

function countConsecutiveFromEnd(arr, predicate) {
    let count = 0;
    for (let i = arr.length - 1; i >= 0; i--) {
        if (predicate(arr[i])) count++;
        else break;
    }
    return count;
}
