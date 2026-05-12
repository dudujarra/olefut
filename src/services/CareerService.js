/**
 * CareerService — Player Career + Manager Career + Transição
 *
 * AKITA-RFCT-014/015/016 collapsed.
 *
 * Constructor injection. Stateless service.
 * Transição de aposentadoria implementada inline no método retireProPlayer.
 */


import { rng as systemRng } from '../engine/rng.js';

export class CareerService {
    constructor({ mythService = null, relationshipService = null, narrativeService = null } = {}) {
        this._mythService = mythService;
        this._relationshipService = relationshipService;
        this._narrativeService = narrativeService;
    }

    // ========================================================================
    // RFCT-014: ProPlayer career
    // ========================================================================

    /**
     * Returns ProPlayer state.
     */
    getProPlayer(engineOrSave) {
        return engineOrSave?.proPlayer || null;
    }

    /**
     * Advance ProPlayer career N weeks (Player mode).
     * Full implementation: energy, development, form, match stats, injury, aging.
     */
    advanceCareer(engineOrSave, weeks = 1) {
        const proPlayer = this.getProPlayer(engineOrSave);
        if (!proPlayer || proPlayer.retired) return { success: false };

        const events = [];
        for (let w = 0; w < weeks; w++) {
            proPlayer.weeksPlayed = (proPlayer.weeksPlayed || 0) + 1;

            // Energy: match day costs 15-22, recovery +10 if rested
            const energyCost = 15 + Math.floor(systemRng() * 8);
            proPlayer.energy = Math.max(0, (proPlayer.energy || 80) - energyCost);
            if (proPlayer.energy < 30) {
                events.push({ type: 'fatigue', msg: `${proPlayer.name} está exausto (${proPlayer.energy}% energia)` });
            }

            // Form: based on recent performance (simulated)
            const matchRating = 5.0 + systemRng() * 5.0; // 5.0-10.0
            proPlayer.lastRating = Math.round(matchRating * 10) / 10;
            proPlayer.form = proPlayer.form || { trend: 0, recent: [] };
            proPlayer.form.recent = proPlayer.form.recent || [];
            proPlayer.form.recent.push(matchRating);
            if (proPlayer.form.recent.length > 10) proPlayer.form.recent.shift();
            proPlayer.form.trend = proPlayer.form.recent.reduce((s, r) => s + r, 0) / proPlayer.form.recent.length - 7.0;

            // Match stats: goals, assists based on position
            proPlayer.seasonGoals = proPlayer.seasonGoals || 0;
            proPlayer.seasonAssists = proPlayer.seasonAssists || 0;
            proPlayer.seasonApps = (proPlayer.seasonApps || 0) + 1;
            // BUG-086: ensure career sub-tree exists for hat-trick tracking + Hat_trick achievement
            proPlayer.career = proPlayer.career || {};
            proPlayer.career.hatTricks = proPlayer.career.hatTricks || 0;
            const isAttacker = proPlayer.position === 'ATA';
            const isMid = proPlayer.position === 'MEI';
            let matchGoals = 0;
            if (isAttacker && systemRng() < 0.35) { matchGoals++; proPlayer.seasonGoals++; events.push({ type: 'goal', msg: `⚽ GOL de ${proPlayer.name}!` }); }
            if (isAttacker && systemRng() < 0.18) { matchGoals++; proPlayer.seasonGoals++; events.push({ type: 'goal', msg: `⚽ Segundo gol de ${proPlayer.name}!` }); }
            if (isAttacker && systemRng() < 0.08) { matchGoals++; proPlayer.seasonGoals++; events.push({ type: 'goal', msg: `⚽ Terceiro gol de ${proPlayer.name}!` }); }
            if (isMid && systemRng() < 0.20) { matchGoals++; proPlayer.seasonGoals++; events.push({ type: 'goal', msg: `⚽ GOL de ${proPlayer.name}!` }); }
            if ((isAttacker || isMid) && systemRng() < 0.25) { proPlayer.seasonAssists++; }
            // BUG-086: hat-trick = 3+ gols numa partida (Hat_trick achievement callsite)
            if (matchGoals >= 3) {
                proPlayer.career.hatTricks++;
                events.push({ type: 'hat_trick', msg: `🎩 HAT-TRICK de ${proPlayer.name}!` });
            }

            // Injury risk: 3% per match, higher if fatigued
            const injuryChance = proPlayer.energy < 30 ? 0.08 : 0.03;
            if (!proPlayer.injury && systemRng() < injuryChance) {
                proPlayer.injury = { weeks: 1 + Math.floor(systemRng() * 4), type: 'muscular' };
                events.push({ type: 'injury', msg: `🏥 ${proPlayer.name} lesionado (${proPlayer.injury.weeks} semanas)` });
            }
            if (proPlayer.injury) {
                proPlayer.injury.weeks--;
                if (proPlayer.injury.weeks <= 0) {
                    proPlayer.injury = null;
                    events.push({ type: 'recovery', msg: `💪 ${proPlayer.name} recuperado!` });
                }
            }

            // Development (weekly OVR change chance)
            if (proPlayer.age < 28 && systemRng() < 0.08) {
                proPlayer.ovr = Math.min(proPlayer.potential || 99, (proPlayer.ovr || 60) + 1);
                events.push({ type: 'growth', msg: `📈 ${proPlayer.name} evoluiu! OVR ${proPlayer.ovr}` });
            }
            if (proPlayer.age > 32 && systemRng() < 0.05) {
                proPlayer.ovr = Math.max(40, (proPlayer.ovr || 60) - 1);
                events.push({ type: 'decline', msg: `📉 ${proPlayer.name} declinou. OVR ${proPlayer.ovr}` });
            }

            // Aging (every 38 weeks = 1 season)
            if (proPlayer.weeksPlayed % 38 === 0) {
                proPlayer.age = (proPlayer.age || 20) + 1;
                proPlayer.seasonGoals = 0;
                proPlayer.seasonAssists = 0;
                proPlayer.seasonApps = 0;
                events.push({ type: 'birthday', msg: `🎂 ${proPlayer.name} completou ${proPlayer.age} anos` });
                if (proPlayer.age >= 38) {
                    proPlayer.retired = true;
                    events.push({ type: 'retirement', msg: `👴 ${proPlayer.name} anunciou aposentadoria aos ${proPlayer.age}` });
                }
            }

            // Energy recovery (partial each week)
            proPlayer.energy = Math.min(100, (proPlayer.energy || 50) + 8);
        }

        return { success: true, weeksPlayed: proPlayer.weeksPlayed, events };
    }

    /**
     * Retire ProPlayer + transition to Manager (mesmo save).
     * Uses Replace Method with Method Object pattern.
     */
    retireProPlayer(engineOrSave) {
        const proPlayer = this.getProPlayer(engineOrSave);
        if (!proPlayer || proPlayer.retired) return { success: false, reason: 'no proPlayer or already retired' };

        // Retire
        proPlayer.retired = true;
        proPlayer.retiredAt = proPlayer.age || 35;

        // SPEC-F2.2: push pra Legends Cross-Save Pool
        try {
            // Lazy import pra evitar cycle + permitir tree-shake em saves novos
            // eslint-disable-next-line no-unused-vars
            import('../engine/LegendsCrossSavePool.js').then(({ markRetired }) => {
                markRetired({
                    playerId: proPlayer.id || `pp-${proPlayer.name}`,
                    saveId: engineOrSave.saveId || engineOrSave.manager?.name || 'unknown',
                    retiredYear: engineOrSave.seasonNumber || 0,
                    hallEntry: {
                        slot: 'idoloEterno',
                        slotLabel: 'Ídolo Eterno',
                        playerName: proPlayer.name,
                        stats: {
                            apps: proPlayer.careerApps || proPlayer.seasonApps || 0,
                            goals: proPlayer.careerGoals || proPlayer.seasonGoals || 0,
                        },
                    },
                    finalAttrs: {
                        leadership: proPlayer.relationships?.boss || 60,
                        technique: proPlayer.skills?.technique || 60,
                        charisma: proPlayer.relationships?.fans || 60,
                    },
                });
            }).catch(() => { /* defensive */ });
        } catch { /* defensive */ }

        // Transition to manager mode
        engineOrSave.mode = 'manager';
        engineOrSave.manager = engineOrSave.manager || {};
        engineOrSave.manager.name = proPlayer.name;
        engineOrSave.manager.formerPlayer = true;
        engineOrSave.manager.teamId = engineOrSave.manager?.teamId || proPlayer.teamId;

        return {
            success: true,
            msg: `${proPlayer.name} aposentou-se aos ${proPlayer.retiredAt} anos e virou treinador.`
        };
    }

    // ========================================================================
    // RFCT-015: Manager career
    // ========================================================================

    /**
     * Returns manager career state.
     */
    getManagerCareer(engineOrSave) {
        return engineOrSave?.managerCareer || null;
    }

    /**
     * Sign manager with club.
     */
    signWithClub(engineOrSave, clubId, contract = {}) {
        if (!engineOrSave) return { success: false };
        engineOrSave.managerCareer = engineOrSave.managerCareer || {
            history: [],
            startedAt: Date.now()
        };

        // Close current club entry if exists
        if (engineOrSave.managerCareer.currentClubId) {
            const last = engineOrSave.managerCareer.history.find(
                h => h.clubId === engineOrSave.managerCareer.currentClubId && !h.endedAt
            );
            if (last) last.endedAt = Date.now();
        }

        engineOrSave.managerCareer.currentClubId = clubId;
        engineOrSave.managerCareer.history.push({
            clubId,
            signedAt: Date.now(),
            contractWeeks: contract.weeks || 38,
            salary: contract.salary || 5000,
            endedAt: null
        });
        return { success: true };
    }

    /**
     * Returns active offers. Generates realistic transfer interest based on player reputation.
     */
    getOffers(engineOrSave) {
        if (!engineOrSave) return [];
        const offers = Array.isArray(engineOrSave.managerCareer?.offers)
            ? [...engineOrSave.managerCareer.offers]
            : [];

        // Auto-generate transfer interest for ProPlayer based on performance
        const proPlayer = this.getProPlayer(engineOrSave);
        if (proPlayer && !proPlayer.retired && proPlayer.ovr >= 70) {
            const avgForm = proPlayer.form?.trend || 0;
            if (avgForm > 0.5 && systemRng() < 0.15) {
                const CLUB_TIERS = [
                    { name: 'Real Castilla', tier: 'big', salaryMul: 3.0 },
                    { name: 'AC Milão', tier: 'big', salaryMul: 2.8 },
                    { name: 'Bayern Munique', tier: 'big', salaryMul: 2.5 },
                    { name: 'PSG', tier: 'big', salaryMul: 3.5 },
                    { name: 'Manchester Blue', tier: 'big', salaryMul: 3.0 },
                    { name: 'Sporting Clube', tier: 'mid', salaryMul: 1.5 },
                    { name: 'Ajax', tier: 'mid', salaryMul: 1.8 },
                    { name: 'Porto FC', tier: 'mid', salaryMul: 1.6 },
                ];
                const club = CLUB_TIERS[Math.floor(systemRng() * CLUB_TIERS.length)];
                offers.push({
                    id: `offer_${Date.now()}_${Math.floor(systemRng() * 10000)}`,
                    type: 'transfer',
                    fromClub: club.name,
                    clubTier: club.tier,
                    salary: Math.floor((proPlayer.ovr * proPlayer.ovr * 5) * club.salaryMul),
                    contractWeeks: 52 + Math.floor(systemRng() * 104),
                    createdAt: Date.now(),
                });
            }
        }
        return offers;
    }

    /**
     * Adds offer to manager career.
     */
    addOffer(engineOrSave, offer) {
        if (!engineOrSave) return { success: false };
        engineOrSave.managerCareer = engineOrSave.managerCareer || { history: [], offers: [] };
        engineOrSave.managerCareer.offers = engineOrSave.managerCareer.offers || [];
        engineOrSave.managerCareer.offers.push({
            id: `offer_${Date.now()}_${systemRng().toString(36).slice(2, 8)}`,
            ...offer,
            createdAt: Date.now()
        });
        return { success: true };
    }

    // ========================================================================
    // AKITA-RFCT-019.1: Player mode weekly processing (extracted from engine.advanceWeek)
    // ========================================================================

    /**
     * Processa proPlayer career na semana (Player mode).
     * Inclui: wage, bench status, match participation, energy decay, stat sync,
     * weekly slot reset, renown update.
     *
     * @param {Engine} engine
     * @param {object} weekResults — keyed por tournamentId
     */
    processPlayerWeek(engine, weekResults) {
        const proPlayer = engine?.proPlayer;
        if (!proPlayer) return;

        proPlayer.receiveWage();

        // Check bench status
        proPlayer.checkBenchStatus();

        // Se o jogador não foi barrado, cobrar o preço do jogo
        if (!proPlayer.isBenched) {
            let matchWon = false;
            for (const tId in weekResults) {
                const match = weekResults[tId].find(m => m.home === engine.manager.teamId || m.away === engine.manager.teamId);
                if (match && match.score) {
                    if (match.home === engine.manager.teamId && match.score.homeGoals > match.score.awayGoals) matchWon = true;
                    if (match.away === engine.manager.teamId && match.score.awayGoals > match.score.homeGoals) matchWon = true;
                }
            }

            const goalsScored = proPlayer.seasonGoals - (proPlayer.lastWeekGoals || 0);
            proPlayer.lastWeekGoals = proPlayer.seasonGoals;
            proPlayer.playMatch(90, goalsScored, matchWon);
        } else {
            proPlayer.playMatch(0, 0, false);
        }

        proPlayer.energy = Math.max(0, proPlayer.energy - proPlayer.energyDecayRate);

        // SCHEMA-UNIFIED: Sync root-level stats from skills
        proPlayer.attacking  = proPlayer.skills.pace;
        proPlayer.defending  = proPlayer.skills.power;
        proPlayer.creativity = proPlayer.skills.vision;
        proPlayer.technical  = proPlayer.skills.technique;

        // Reset weekly slots
        proPlayer.resetWeeklySlots();

        // Update renown
        proPlayer.renown += proPlayer.seasonGoals > 0 ? 1 : 0;
        proPlayer.updateStarRating();
    }
}
