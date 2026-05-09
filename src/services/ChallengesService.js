/**
 * ChallengesService — SPEC-103
 *
 * Weekly challenges 100% opcionais (anti-FOMO predatório).
 * Reward: prestige + small money + cosmetic unlock.
 */

const STORAGE_KEY = 'elifoot_challenges';

export const WEEKLY_CHALLENGES = [
    {
        id: 'win_3',
        title: 'Tricampeão Semanal',
        desc: 'Vença 3 jogos esta semana',
        target: 3,
        check: (engine) => engine.managerStats?.streak >= 3,
        reward: { prestige: 5, money: 50000 }
    },
    {
        id: 'hattrick',
        title: 'Hat-Trick',
        desc: 'Marque hat-trick em 1 jogo',
        target: 1,
        check: (engine) => {
            const team = engine.getTeam(engine.manager?.teamId);
            return team?.squad?.some(p => p.career?.hatTricks > 0);
        },
        reward: { prestige: 8, money: 100000 }
    },
    {
        id: 'clean_sheet_2',
        title: 'Defesa Sólida',
        desc: '2 jogos sem sofrer gols',
        target: 2,
        check: (engine) => (engine.managerStats?.cleanSheets || 0) >= 2,
        reward: { prestige: 4, money: 30000 }
    },
    {
        id: 'streak_5',
        title: 'Cinco Seguidas',
        desc: 'Vença 5 jogos consecutivos',
        target: 5,
        check: (engine) => engine.managerStats?.streak >= 5,
        reward: { prestige: 10, money: 200000 }
    },
    {
        id: 'youth_promote',
        title: 'Olho Bom',
        desc: 'Promova 1 jogador da base',
        target: 1,
        check: (engine) => {
            const team = engine.getTeam(engine.manager?.teamId);
            return team?.squad?.filter(p => p.isYouth && p.isTitular).length > 0;
        },
        reward: { prestige: 6, money: 75000 }
    }
];

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : { activeWeek: 0, completed: {} };
    } catch {
        return { activeWeek: 0, completed: {} };
    }
}

function saveState(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function getActiveChallenges(engine) {
    if (!engine) return [];
    const week = engine.currentWeek || 1;
    const state = loadState();

    // Rotate 3 challenges per week (deterministic)
    const seed = (week * 7) % WEEKLY_CHALLENGES.length;
    const active = [
        WEEKLY_CHALLENGES[seed % WEEKLY_CHALLENGES.length],
        WEEKLY_CHALLENGES[(seed + 1) % WEEKLY_CHALLENGES.length],
        WEEKLY_CHALLENGES[(seed + 2) % WEEKLY_CHALLENGES.length]
    ];

    return active.map(c => ({
        ...c,
        completed: !!state.completed[`${week}_${c.id}`],
        progress: c.check(engine) ? 100 : 0
    }));
}

export function claimChallenge(engine, challengeId) {
    if (!engine) return { success: false };
    const week = engine.currentWeek || 1;
    const state = loadState();
    const key = `${week}_${challengeId}`;

    if (state.completed[key]) return { success: false, msg: 'Já recebido' };

    const challenge = WEEKLY_CHALLENGES.find(c => c.id === challengeId);
    if (!challenge) return { success: false };

    if (!challenge.check(engine)) return { success: false, msg: 'Desafio não completado' };

    state.completed[key] = true;
    saveState(state);

    // Apply reward
    const team = engine.getTeam(engine.manager?.teamId);
    if (team && challenge.reward.money) team.balance += challenge.reward.money;
    if (engine.legacy && challenge.reward.prestige) engine.legacy.prestige = (engine.legacy.prestige || 0) + challenge.reward.prestige;

    return { success: true, reward: challenge.reward };
}
