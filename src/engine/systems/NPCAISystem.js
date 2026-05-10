// SPEC-019: NPC AI & Team Behavior System
// Decisões automáticas para times NPC: transfers, staff, tactics.

/**
 * §5: 6 NPC Club Personalities — deterministic, seeded per team ID.
 * Each personality biases transfer behavior, tactical style, and budget allocation.
 */
export const NPC_PERSONALITIES = {
    buyer:       { label: 'Comprador',        bidMulBonus: 0.15, youthFocus: 0.0, sellStarChance: 0.05, tacticBias: 'ofensivo' },
    seller:      { label: 'Vendedor',         bidMulBonus: -0.10, youthFocus: 0.2, sellStarChance: 0.40, tacticBias: 'equilibrado' },
    youth:       { label: 'Formador',         bidMulBonus: -0.20, youthFocus: 0.8, sellStarChance: 0.10, tacticBias: 'equilibrado' },
    pragmatic:   { label: 'Pragmático',       bidMulBonus: 0.0,  youthFocus: 0.3, sellStarChance: 0.15, tacticBias: 'defensivo' },
    ambitious:   { label: 'Ambicioso',        bidMulBonus: 0.25, youthFocus: 0.1, sellStarChance: 0.02, tacticBias: 'ofensivo' },
    conservative:{ label: 'Conservador',      bidMulBonus: -0.05, youthFocus: 0.4, sellStarChance: 0.08, tacticBias: 'defensivo' },
};

const PERSONALITY_KEYS = Object.keys(NPC_PERSONALITIES);

export const NPC_GOALS = {
    title: { rankingMin: 1, rankingMax: 2, bidMul: [0.9, 1.1], aggressive: true },
    promotion: { rankingMin: 3, rankingMax: 5, bidMul: [0.85, 1.0], aggressive: true },
    survival: { rankingMin: 18, rankingMax: 24, bidMul: [0.5, 0.7], aggressive: false },
    cl_qualification: { rankingMin: 3, rankingMax: 4, bidMul: [0.9, 1.05], aggressive: true },
    renovation: { rankingMin: 8, rankingMax: 12, bidMul: [0.8, 0.95], aggressive: false },
    youth_focus: { rankingMin: 13, rankingMax: 17, bidMul: [0.7, 0.9], aggressive: false },
};

// BUG-013 fix: rngState foi removido do escopo module-level (race condition entre instances).
// Cada instância tem seu próprio state encapsulado.
function makeRng(seed) {
    let state = seed;
    return function () {
        let t = (state += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export class NPCAISystem {
    constructor(seed = 12345) {
        this.teamGoals = new Map(); // teamId → goal
        this.teamPersonalities = new Map(); // teamId → personality key
        this.lastTacticChange = new Map(); // teamId → weekNum
        this.recentResults = new Map(); // teamId → [results]
        this.rng = makeRng(seed);
    }

    setSeed(seed) {
        this.rng = makeRng(seed);
    }

    /**
     * §5: Deterministic personality assignment based on team ID.
     * Same team always gets same personality across saves/sessions.
     */
    getPersonality(teamId) {
        if (this.teamPersonalities.has(teamId)) return this.teamPersonalities.get(teamId);
        // Deterministic hash: team ID → personality index
        const hash = ((teamId * 2654435761) >>> 0) % PERSONALITY_KEYS.length;
        const pKey = PERSONALITY_KEYS[hash];
        this.teamPersonalities.set(teamId, pKey);
        return pKey;
    }

    getPersonalityConfig(teamId) {
        return NPC_PERSONALITIES[this.getPersonality(teamId)];
    }

    setNPCGoal(teamId, goal) {
        if (!NPC_GOALS[goal]) return false;
        this.teamGoals.set(teamId, goal);
        return true;
    }

    inferGoal({ ranking, lastSeasonRanking, teamId }) {
        const personality = teamId != null ? this.getPersonality(teamId) : null;

        // Youth-focused clubs prefer youth_focus even when doing well
        if (personality === 'youth' && ranking >= 6 && ranking <= 17) return 'youth_focus';

        // Ambitious clubs push for title/CL more aggressively
        if (personality === 'ambitious' && ranking <= 5) return 'title';

        if (ranking <= 2) return 'title';
        if (ranking >= 18) return 'survival';
        if (ranking >= 3 && ranking <= 4) return 'cl_qualification';
        if (ranking >= 5 && ranking <= 7 && lastSeasonRanking <= 5) return 'cl_qualification';
        if (ranking >= 13 && ranking <= 17) return 'youth_focus';
        return 'renovation';
    }

    weeklyDecision({ teamId, weekOfYear, ranking, money, results = {} }) {
        const goal = this.teamGoals.get(teamId) || this.inferGoal({ ranking, lastSeasonRanking: ranking, teamId });
        const config = NPC_GOALS[goal];
        const personality = this.getPersonalityConfig(teamId);
        const decisions = [];

        // Track recent results
        const history = this.recentResults.get(teamId) || [];
        if (results.lastResult) history.push(results.lastResult);
        if (history.length > 10) history.shift();
        this.recentResults.set(teamId, history);

        // Tactic change after 3 losses (cooldown 4 weeks since last change)
        const last3 = history.slice(-3);
        const last3Losses = last3.filter((r) => r === 'loss').length;
        const lastChange = this.lastTacticChange.get(teamId);
        const cooldownOk = lastChange === undefined || (weekOfYear - lastChange) > 4;
        if (last3Losses >= 3 && cooldownOk) {
            decisions.push({
                type: 'tactic_change',
                target: personality.tacticBias || 'defensive',
                priority: 8,
                executedWeek: weekOfYear,
            });
            this.lastTacticChange.set(teamId, weekOfYear);
        }

        // Personality-driven sell: seller clubs proactively list stars
        if (this.rng() < personality.sellStarChance) {
            decisions.push({
                type: 'transfer_bid',
                target: 'sell_stars',
                priority: 6,
                executedWeek: null,
                reason: `Personality: ${personality.label}`,
            });
        }

        // Survival: sell stars (regardless of personality)
        if (goal === 'survival') {
            decisions.push({
                type: 'transfer_bid',
                target: 'sell_stars',
                priority: 9,
                executedWeek: null,
            });
        }

        // Title/ambitious goal: bid aggressively (personality buyer bonus)
        const buyThreshold = personality.bidMulBonus > 0 ? 5000000 : 10000000;
        if ((goal === 'title' || goal === 'cl_qualification') && money > buyThreshold) {
            decisions.push({
                type: 'transfer_bid',
                target: 'star_player',
                priority: 7,
                executedWeek: null,
                bidMul: config.bidMul,
            });
        }

        // Youth focus: promote from academy instead of buying
        if (personality.youthFocus > 0.5 && this.rng() < personality.youthFocus * 0.3) {
            decisions.push({
                type: 'youth_promote',
                target: 'academy',
                priority: 5,
                executedWeek: weekOfYear,
            });
        }

        return {
            teamId,
            weekOfYear,
            goal,
            personality: this.getPersonality(teamId),
            decisions,
            reasoning: `Goal=${goal}, personality=${personality.label}, ranking=${ranking}, last3=${last3.join('/')}`,
        };
    }

    getNPCBid({ teamId, marketValue }) {
        const goal = this.teamGoals.get(teamId) || 'renovation';
        const config = NPC_GOALS[goal];
        const personality = this.getPersonalityConfig(teamId);
        const [min, max] = config.bidMul;
        const r = this.rng();
        const baseMul = min + r * (max - min);
        // Personality bonus: buyers overbid, sellers underbid
        const finalMul = baseMul + (personality?.bidMulBonus || 0);
        return Math.floor(marketValue * Math.max(0.3, finalMul));
    }

    /**
     * SPEC-019: Utility Scoring para avaliar contratações
     * Calcula a utilidade (0-100) de um jogador para um time NPC baseado na fraqueza do setor.
     * @param {object} player — O jogador alvo
     * @param {object} teamSectors — Força atual dos setores do NPC
     * @param {number} teamReputation — Reputação/OVR médio do NPC
     * @returns {number}
     */
    evaluatePlayerUtility(player, teamSectors, teamReputation = 50) {
        if (!player || !teamSectors) return 0;
        let baseUtility = player.ovr;

        // Bônus se o jogador for melhor que a reputação do time
        if (player.ovr > teamReputation) {
            baseUtility += (player.ovr - teamReputation) * 1.5;
        }

        // Bônus de necessidade de setor
        let sectorStrength = 50;
        if (player.position === 'GOL') sectorStrength = teamSectors.goalkeeper;
        else if (player.position === 'DEF') sectorStrength = teamSectors.defense;
        else if (player.position === 'MEI') sectorStrength = teamSectors.midfield;
        else if (player.position === 'ATA') sectorStrength = teamSectors.attack;

        const weakness = Math.max(0, 80 - sectorStrength); // Se setor < 80, NPC tem urgência
        const positionalUtility = weakness * 0.5;

        // Idade (Preferência por jovens)
        const agePenalty = player.age > 30 ? (player.age - 30) * 2 : 0;
        const potentialBonus = player.potential ? Math.max(0, player.potential - player.ovr) * 0.3 : 0;

        return Math.max(0, Math.min(100, Math.floor(baseUtility + positionalUtility - agePenalty + potentialBonus)));
    }

    seasonDecision({ teamId, finalRanking, budget }) {
        const goal = this.teamGoals.get(teamId) || this.inferGoal({ ranking: finalRanking, lastSeasonRanking: finalRanking });
        const decisions = [];

        if (goal === 'title' && budget > 50000000) {
            decisions.push({ type: 'staff_hire', target: 'Director', priority: 9 });
            decisions.push({ type: 'transfer_bid', target: 'top_5', priority: 10 });
        }
        if (budget > 20000000 && finalRanking <= 3) {
            // Stadium upgrade only if cash permits
            decisions.push({ type: 'stadium_upgrade', target: 'next_level', priority: 6 });
        }

        return { teamId, finalRanking, decisions };
    }
}
