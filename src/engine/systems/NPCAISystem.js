// SPEC-019: NPC AI & Team Behavior System
// Decisões automáticas para times NPC: transfers, staff, tactics.

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
        this.lastTacticChange = new Map(); // teamId → weekNum
        this.recentResults = new Map(); // teamId → [results]
        this.rng = makeRng(seed);
    }

    setSeed(seed) {
        this.rng = makeRng(seed);
    }

    setNPCGoal(teamId, goal) {
        if (!NPC_GOALS[goal]) return false;
        this.teamGoals.set(teamId, goal);
        return true;
    }

    inferGoal({ ranking, lastSeasonRanking }) {
        if (ranking <= 2) return 'title';
        if (ranking >= 18) return 'survival';
        if (ranking >= 3 && ranking <= 4) return 'cl_qualification';
        if (ranking >= 5 && ranking <= 7 && lastSeasonRanking <= 5) return 'cl_qualification';
        if (ranking >= 13 && ranking <= 17) return 'youth_focus';
        return 'renovation';
    }

    weeklyDecision({ teamId, weekOfYear, ranking, money, results = {} }) {
        const goal = this.teamGoals.get(teamId) || this.inferGoal({ ranking, lastSeasonRanking: ranking });
        const config = NPC_GOALS[goal];
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
                target: 'defensive',
                priority: 8,
                executedWeek: weekOfYear,
            });
            this.lastTacticChange.set(teamId, weekOfYear);
        }

        // Survival: sell stars
        if (goal === 'survival') {
            decisions.push({
                type: 'transfer_bid',
                target: 'sell_stars',
                priority: 9,
                executedWeek: null,
            });
        }

        // Title goal: bid aggressively
        if (goal === 'title' && money > 10000000) {
            decisions.push({
                type: 'transfer_bid',
                target: 'star_player',
                priority: 7,
                executedWeek: null,
                bidMul: config.bidMul,
            });
        }

        return {
            teamId,
            weekOfYear,
            goal,
            decisions,
            reasoning: `Goal=${goal}, ranking=${ranking}, last3=${last3.join('/')}`,
        };
    }

    getNPCBid({ teamId, marketValue }) {
        const goal = this.teamGoals.get(teamId) || 'renovation';
        const config = NPC_GOALS[goal];
        const [min, max] = config.bidMul;
        const r = this.rng();
        const mul = min + r * (max - min);
        return Math.floor(marketValue * mul);
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
