// SPEC-026: Prestige & Reputation System
// Prestige time + jogador. Tiers: Local→Legendary. Decay 5%/year.

export const PRESTIGE_SOURCES = {
    'Título Campeonato': 50,
    'Copa regional': 30,
    'Taça intl': 100,
    'Final intl': 25,
    'Win streak': 5,
    'Promotion': 10,
    'Star signing': 2,
    'Famous coach': 1,
    'Bad season': -20,
    'Relegation': -50,
};

export const PRESTIGE_TIERS = [
    { name: 'Local', min: 0, max: 50, scout: 0.8, transfer: 0.85, salary: 1.1 },
    { name: 'Regional', min: 51, max: 150, scout: 0.9, transfer: 0.9, salary: 1.05 },
    { name: 'Nacional', min: 151, max: 300, scout: 1.0, transfer: 1.0, salary: 1.0 },
    { name: 'Intl', min: 301, max: 500, scout: 1.1, transfer: 1.05, salary: 0.95 },
    { name: 'Elite', min: 501, max: 1000, scout: 1.2, transfer: 1.15, salary: 0.9 },
    { name: 'Legendary', min: 1001, max: Infinity, scout: 1.5, transfer: 1.25, salary: 0.8 },
];

export class PrestigeSystem {
    constructor() {
        this.teamPrestige = new Map(); // teamId → number
        this.history = new Map(); // teamId → array of events
    }

    addPrestige(teamId, source, points = null) {
        const pts = points ?? PRESTIGE_SOURCES[source] ?? 0;
        const current = this.teamPrestige.get(teamId) || 0;
        const newPrestige = Math.max(0, current + pts);
        this.teamPrestige.set(teamId, newPrestige);
        const hist = this.history.get(teamId) || [];
        hist.push({ source, points: pts, year: new Date().getFullYear() });
        this.history.set(teamId, hist);
        return newPrestige;
    }

    setPrestige(teamId, value) {
        this.teamPrestige.set(teamId, Math.max(0, value));
    }

    getPrestige(teamId) {
        return this.teamPrestige.get(teamId) || 0;
    }

    getTier(teamId) {
        const p = this.getPrestige(teamId);
        return PRESTIGE_TIERS.find((t) => p >= t.min && p <= t.max).name;
    }

    getTransferModifier(teamId) {
        const p = this.getPrestige(teamId);
        const tier = PRESTIGE_TIERS.find((t) => p >= t.min && p <= t.max);
        return tier.transfer;
    }

    getScoutingModifier(teamId) {
        const p = this.getPrestige(teamId);
        const tier = PRESTIGE_TIERS.find((t) => p >= t.min && p <= t.max);
        return tier.scout;
    }

    getSalaryModifier(teamId) {
        const p = this.getPrestige(teamId);
        const tier = PRESTIGE_TIERS.find((t) => p >= t.min && p <= t.max);
        return tier.salary;
    }

    processYear() {
        // BUG-012 fix: decay 5% mas preserva floor mínimo (Math.round vs Math.floor + cap)
        // Math.floor(1 * 0.95) = 0 destrói prestige baixo permanentemente.
        // Solução: round, e abaixo de 20 não decai (proteção tier Local).
        for (const [teamId, prestige] of this.teamPrestige.entries()) {
            if (prestige < 20) continue; // proteção tier Local
            this.teamPrestige.set(teamId, Math.round(prestige * 0.95));
        }
    }

    getTeamRanking(top = 20) {
        return [...this.teamPrestige.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, top)
            .map(([teamId, prestige], idx) => ({
                ranking: idx + 1,
                teamId,
                prestige,
                tier: this.getTier(teamId),
            }));
    }

    getPrestigeHistory(teamId) {
        return this.history.get(teamId) || [];
    }
}
