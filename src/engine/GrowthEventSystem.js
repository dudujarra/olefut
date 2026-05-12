import { rng as systemRng } from './rng.js';
/**
 * GrowthEventSystem — SPEC-134: Progression Growth Events
 *
 * Injeta eventos de crescimento orgânico que movem o OVR do squad.
 * Resolve Progression score=30 (growthEventCount=0, slope=0.08 em 203 seasons).
 *
 * Stateless: recebe squad, retorna eventos + mutações a aplicar.
 */

const OVR_FLOOR = 30;
const OVR_CAP   = 99;

/**
 * Avalia squad e retorna growth events da semana.
 *
 * @param {object} opts
 * @param {number} opts.teamId
 * @param {number} opts.week
 * @param {number} opts.season
 * @param {Array}  opts.players — array de jogadores do squad
 * @param {Array<string>} [opts.teamRecentResults=[]] — 'W'|'D'|'L' recentes
 * @returns {{ growthEvents: Array, newSquadOvrAvg: number }}
 */
export function evaluateGrowth({ teamId, week, season, players, teamRecentResults = [] }) {
    const events = [];
    const seenPlayers = new Set();

    const hotStreak = countTrailingWins(teamRecentResults) >= 5;
    const primeGames = (p) => (p.gamesThisSeason || 0) >= 15;

    for (const player of players) {
        if (!player || player._retired || player.injury) continue;

        const age = player.age || 25;
        const ovr = player.ovr || 50;
        const pid = player.id;

        // Youth Breakthrough — sub-21, chance semanal
        if (age < 21 && !seenPlayers.has(`${pid}-youth`) && systemRng() < 0.04) {
            const delta = 2 + Math.floor(systemRng() * 4); // +2 a +5
            const finalOvr = clamp(ovr + delta);
            events.push({
                type: 'youth_breakthrough',
                playerId: pid,
                playerName: player.name,
                ovrDelta: finalOvr - ovr,
                permanent: true,
                narrativeTag: 'CRAQUE_EMERGED',
                apply: () => { player.ovr = finalOvr; applyAttrsBoost(player, delta); },
            });
            seenPlayers.add(`${pid}-youth`);
        }

        // Hot Streak — forma excelente temporal
        if (hotStreak && !seenPlayers.has(`${pid}-hot`) && systemRng() < 0.06) {
            events.push({
                type: 'hot_streak',
                playerId: pid,
                playerName: player.name,
                ovrDelta: 3,
                permanent: false,
                duration: 4,
                narrativeTag: 'FORM_HOT_STREAK',
                apply: () => { player._hotStreakBonus = 3; player._hotStreakWeeks = 4; },
            });
            seenPlayers.add(`${pid}-hot`);
        }

        // Peak Season — prime years, bom volume de jogos
        if (age >= 23 && age <= 27 && primeGames(player) && !seenPlayers.has(`${pid}-peak`) && systemRng() < 0.08) {
            const finalOvr = clamp(ovr + 1);
            events.push({
                type: 'peak_season',
                playerId: pid,
                playerName: player.name,
                ovrDelta: finalOvr - ovr,
                permanent: true,
                narrativeTag: 'PEAK_SEASON',
                apply: () => { player.ovr = finalOvr; },
            });
            seenPlayers.add(`${pid}-peak`);
        }

        // Decline — veteranos
        if (age >= 32 && !seenPlayers.has(`${pid}-decline`) && systemRng() < (age - 30) * 0.03) {
            const finalOvr = Math.max(OVR_FLOOR, ovr - 1);
            events.push({
                type: 'decline',
                playerId: pid,
                playerName: player.name,
                ovrDelta: finalOvr - ovr,
                permanent: true,
                narrativeTag: 'AGING_SIGNAL',
                apply: () => { player.ovr = finalOvr; },
            });
            seenPlayers.add(`${pid}-decline`);
        }

        // Training Breakthrough — jogadores com muitos treinos
        const trainCount = player._recentTrainCount || 0;
        if (trainCount >= 4 && !seenPlayers.has(`${pid}-train`) && systemRng() < 0.12) {
            const finalOvr = clamp(ovr + 2);
            events.push({
                type: 'training_breakthrough',
                playerId: pid,
                playerName: player.name,
                ovrDelta: finalOvr - ovr,
                permanent: true,
                narrativeTag: 'TRAINING_PEAK',
                apply: () => { player.ovr = finalOvr; player._recentTrainCount = 0; },
            });
            seenPlayers.add(`${pid}-train`);
        }
    }

    // Apply all events
    events.forEach(e => { if (e.apply) e.apply(); });

    const activeOvrs = players.filter(p => !p._retired && !p.injury).map(p => p.ovr || 50);
    const newSquadOvrAvg = activeOvrs.length > 0
        ? Math.round(activeOvrs.reduce((s, v) => s + v, 0) / activeOvrs.length)
        : 0;

    // Clean apply refs from output
    return {
        growthEvents: events.map(({ apply: _apply, ...rest }) => rest),
        newSquadOvrAvg,
    };
}

// ─── helpers ────────────────────────────────────────────────

function clamp(v) {
    return Math.max(OVR_FLOOR, Math.min(OVR_CAP, v));
}

function countTrailingWins(results) {
    let count = 0;
    for (const r of results) {
        if (r === 'W') count++;
        else break;
    }
    return count;
}

// SCHEMA-UNIFIED: opera direto nas chaves root-level
function applyAttrsBoost(player, amount) {
    const statKeys = ['attacking', 'technical', 'tactical', 'defending', 'creativity'];
    // Boost 1-2 random attributes
    const picks = statKeys.sort(() => systemRng() - 0.5).slice(0, 2);
    picks.forEach(attr => {
        player[attr] = Math.min(99, (player[attr] || 50) + amount);
    });
}
