/**
 * MatchSimulator — Extracted from engine.playMatch (AKITA-RFCT-004)
 *
 * Status: ACTIVE (PR-0.4 — Extract Class refactor)
 *
 * Responsabilidade: simular 90 minutos de partida + cards + MOTM + energy drain.
 *
 * Invariante RFCT-004:
 * - Mesma assinatura comportamental que engine.playMatch antes do refactor
 * - Mesma ordem de chamadas RNG (Math.random)
 * - Golden master snapshot deve ser idêntico
 *
 * Não muta engine além do que playMatch original mutava:
 * - team.squad[].energy (drain pós-match)
 * - team.squad[].moral (leader trait win bonus)
 * - team.squad[].career stats (recordMatchStats)
 * - engine.teamTalkModifiers (reset)
 */

import { TACTICS } from '../engine/ManagerSystems';
import { TACTIC_COUNTERS, TACTIC_NARRATION, getFormModifier } from '../engine/PlayerDevelopment';
import { getTraitMatchModifier, hasTrait, initCareerStats, recordMatchStats } from '../engine/PlayerTraits';

export class MatchSimulator {
    /**
     * Simula partida completa.
     *
     * @param {Engine} engine — referência para state global
     * @param {number} homeId — id team casa
     * @param {number} awayId — id team visitante
     * @param {boolean} isCup — se true, decide pênaltis em empate
     * @returns {{homeGoals, awayGoals, events}}
     */
    simulate(engine, homeId, awayId, isCup = false) {
        const homeTeam = engine.getTeam(homeId);
        const awayTeam = engine.getTeam(awayId);

        const homeSectors = engine.getTeamSectors(homeId);
        const awaySectors = engine.getTeamSectors(awayId);

        // Tactic setup
        const homeTactic = homeId === engine.manager.teamId ? engine.currentTactic : 'normal';
        const awayTactic = awayId === engine.manager.teamId ? engine.currentTactic : 'normal';
        const tactic = TACTICS[homeTactic] || TACTICS.normal;
        const oppTactic = TACTICS[awayTactic] || TACTICS.normal;

        // Apply tactic modifiers
        const isManagerHome = homeId === engine.manager.teamId;
        const isManagerAway = awayId === engine.manager.teamId;
        if (isManagerHome) {
            homeSectors.attack = Math.floor(homeSectors.attack * tactic.ataModifier * engine.teamTalkModifiers.ata);
            homeSectors.defense = Math.floor(homeSectors.defense * tactic.defModifier * engine.teamTalkModifiers.def);
        } else if (isManagerAway) {
            awaySectors.attack = Math.floor(awaySectors.attack * tactic.ataModifier * engine.teamTalkModifiers.ata);
            awaySectors.defense = Math.floor(awaySectors.defense * tactic.defModifier * engine.teamTalkModifiers.def);
        }

        // Tactic counter modifier
        const homeCounterMod = TACTIC_COUNTERS[homeTactic]?.[awayTactic] || 1.0;
        const awayCounterMod = TACTIC_COUNTERS[awayTactic]?.[homeTactic] || 1.0;

        // Match condition
        const cond = engine.matchCondition || { ataModifier: 1, defModifier: 1, energyModifier: 1 };

        // Narration templates
        const homeNarr = TACTIC_NARRATION[homeTactic] || TACTIC_NARRATION.normal;
        const awayNarr = TACTIC_NARRATION[awayTactic] || TACTIC_NARRATION.normal;

        // SPEC-125 BUG-072: AI counter-tactic — adversários adaptam vs streak.
        // Bot 38 win streak imhuman. Quando bot tem streak >5, opponent fica +10% sectors.
        const myStreak = engine.managerStats?.streak || 0;
        const opponentBoost = myStreak >= 5 ? Math.min(1.3, 1 + (myStreak * 0.02)) : 1.0;
        if (isManagerHome) {
            awaySectors.attack = Math.floor(awaySectors.attack * opponentBoost);
            awaySectors.defense = Math.floor(awaySectors.defense * opponentBoost);
        } else if (isManagerAway) {
            homeSectors.attack = Math.floor(homeSectors.attack * opponentBoost);
            homeSectors.defense = Math.floor(homeSectors.defense * opponentBoost);
        }

        let homeGoals = 0;
        let awayGoals = 0;
        const events = { home: [], away: [], textLog: [], scorers: [], cards: [], motm: null };
        let homeShots = 0, awayShots = 0, homeSaves = 0, awaySaves = 0;

        // Get named players for scoring
        const homeAttackers = (homeTeam.squad || []).filter(p => p.isTitular && (p.position === 'ATA' || p.position === 'MEI') && !p.injury);
        const awayAttackers = (awayTeam.squad || []).filter(p => p.isTitular && (p.position === 'ATA' || p.position === 'MEI') && !p.injury);
        const homeDefenders = (homeTeam.squad || []).filter(p => p.isTitular && p.position === 'DEF' && !p.injury);
        const awayDefenders = (awayTeam.squad || []).filter(p => p.isTitular && p.position === 'DEF' && !p.injury);
        const pickRandom = (arr) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

        // Moral factor
        const homeMoral = (homeTeam.squad || []).reduce((s, p) => s + (p.moral || 50), 0) / (homeTeam.squad?.length || 1);
        const awayMoral = (awayTeam.squad || []).reduce((s, p) => s + (p.moral || 50), 0) / (awayTeam.squad?.length || 1);
        const homeMoralFactor = 0.8 + (homeMoral / 250);
        const awayMoralFactor = 0.8 + (awayMoral / 250);

        // Log condition + tactic
        if (engine.matchCondition && engine.matchCondition.id !== 'normal') {
            events.textLog.push({ minute: 0, text: `${engine.matchCondition.name}` });
        }
        if (isManagerHome || isManagerAway) {
            events.textLog.push({ minute: 0, text: `📋 Tática: ${tactic.name}` });
        }

        // Performance tracker for MOTM
        const performanceMap = {};

        // BUG-033 + SPEC-125: cap reduzido 12→8, scorelines mais realistas.
        // Frequência 12-0 / 11-1 era anormal. Football real raramente passa 6 goals total.
        const MAX_COMBINED_GOALS = 8;
        for (let minute = 1; minute <= 90; minute++) {
            if (homeGoals + awayGoals >= MAX_COMBINED_GOALS) break;
            const isHomeAttacking = Math.random() > 0.45;
            const atkSectors = isHomeAttacking ? homeSectors : awaySectors;
            const defSectors = isHomeAttacking ? awaySectors : homeSectors;
            const atkMoral = isHomeAttacking ? homeMoralFactor : awayMoralFactor;
            const counterMod = isHomeAttacking ? homeCounterMod : awayCounterMod;
            const attTeam = isHomeAttacking ? homeTeam : awayTeam;
            const defTeam = isHomeAttacking ? awayTeam : homeTeam;
            const narr = isHomeAttacking ? homeNarr : awayNarr;
            const attackers = isHomeAttacking ? homeAttackers : awayAttackers;

            // Filler narration every ~12 min
            if (minute % 12 === 0) {
                const fillerTemplate = narr.filler[Math.floor(Math.random() * narr.filler.length)];
                events.textLog.push({
                    minute,
                    text: fillerTemplate.replace('{atk}', attTeam.name).replace('{def}', defTeam.name)
                });
            }

            // Chance creation (SPEC-125: cap chanceRatio para evitar spike unbounded)
            const rawRatio = (atkSectors.attack * cond.ataModifier * atkMoral * counterMod) / (defSectors.defense * cond.defModifier || 1);
            const chanceRatio = Math.min(rawRatio, 2.5); // cap em 2.5× (era unbounded)
            if (Math.random() < (0.12 * chanceRatio)) {
                if (isHomeAttacking) homeShots++; else awayShots++;

                const scorer = pickRandom(attackers);
                const formMod = scorer ? getFormModifier(scorer.form?.trend) : 1.0;
                const traitMod = scorer ? getTraitMatchModifier(scorer, minute, isManagerHome ? homeTactic : awayTactic, false) : 1.0;
                const shotPower = atkSectors.attack * cond.ataModifier * Math.random() * formMod * traitMod;
                const saveChance = defSectors.goalkeeper * Math.random() * 0.6;

                // Chance narration
                const chanceTemplate = narr.chance[Math.floor(Math.random() * narr.chance.length)];
                events.textLog.push({
                    minute,
                    text: chanceTemplate.replace('{atk}', attTeam.name).replace('{def}', defTeam.name)
                });

                if (shotPower > saveChance) {
                    // GOAL
                    if (isHomeAttacking) {
                        homeGoals++;
                        events.home.push({ minute, type: 'goal', scorer: scorer?.name });
                    } else {
                        awayGoals++;
                        events.away.push({ minute, type: 'goal', scorer: scorer?.name });
                    }

                    const scorerName = scorer ? scorer.name : attTeam.name;
                    const assistPlayer = pickRandom(attackers.filter(p => p !== scorer));
                    const assistText = assistPlayer ? ` (assist: ${assistPlayer.name})` : '';

                    const goalTemplate = narr.goal[Math.floor(Math.random() * narr.goal.length)];
                    events.textLog.push({
                        minute,
                        text: `⚽ ${goalTemplate.replace('{atk}', scorerName).replace('{def}', defTeam.name)}${assistText} (${homeGoals} x ${awayGoals})`
                    });

                    events.scorers.push({ minute, name: scorerName, team: attTeam.name, assist: assistPlayer?.name });

                    // Track performance
                    if (scorer) {
                        performanceMap[scorer.id] = (performanceMap[scorer.id] || 0) + 3;
                        scorer._matchGoals = (scorer._matchGoals || 0) + 1;
                    }
                    if (assistPlayer) {
                        performanceMap[assistPlayer.id] = (performanceMap[assistPlayer.id] || 0) + 2;
                    }
                } else {
                    // SAVE
                    if (isHomeAttacking) awaySaves++; else homeSaves++;
                    const saveTemplate = narr.save[Math.floor(Math.random() * narr.save.length)];
                    events.textLog.push({
                        minute,
                        text: saveTemplate.replace('{atk}', attTeam.name).replace('{def}', defTeam.name)
                    });
                }
            }

            // Yellow card chance (~2% per minute of a foul event)
            if (Math.random() < 0.008) {
                const team = isHomeAttacking ? defTeam : attTeam;
                const defenders = isHomeAttacking ? awayDefenders : homeDefenders;
                const offender = pickRandom(defenders);
                if (offender) {
                    events.cards.push({ minute, player: offender.name, team: team.name, type: 'yellow' });
                    events.textLog.push({ minute, text: `🟨 Cartão amarelo para ${offender.name} (${team.name})!` });
                    performanceMap[offender.id] = (performanceMap[offender.id] || 0) - 1;
                }
            }
        }

        // Penalties
        if (isCup && homeGoals === awayGoals) {
            events.textLog.push({ minute: 90, text: `⚖️ Empate! Decisão nos Pênaltis!` });
            if (Math.random() > 0.5) {
                homeGoals++;
                events.textLog.push({ minute: 91, text: `🏆 ${homeTeam.name} VENCE nos pênaltis!` });
            } else {
                awayGoals++;
                events.textLog.push({ minute: 91, text: `🏆 ${awayTeam.name} VENCE nos pênaltis!` });
            }
        }

        // MOTM — Man of the Match
        const allPlayers = [...(homeTeam.squad || []), ...(awayTeam.squad || [])].filter(p => p.isTitular);
        let bestPerf = -1, motm = null;
        allPlayers.forEach(p => {
            const perf = (performanceMap[p.id] || 0);
            if (perf > bestPerf) { bestPerf = perf; motm = p; }
        });
        if (motm && bestPerf > 0) {
            events.motm = { name: motm.name, team: homeTeam.squad?.includes(motm) ? homeTeam.name : awayTeam.name, score: bestPerf };
            events.textLog.push({ minute: 90, text: `⭐ Craque do Jogo: ${motm.name}` });
        }

        // Match stats
        events.stats = { homeShots, awayShots, homeSaves, awaySaves };

        // Energy drain (trait: workhorse saves 30%)
        const energyDrain = Math.floor(15 + Math.random() * 10) * (cond.energyModifier || 1);
        [...(homeTeam.squad || []), ...(awayTeam.squad || [])].filter(p => p.isTitular).forEach(p => {
            const saveMod = hasTrait(p, 'workhorse') ? 0.7 : 1.0;
            p.energy = Math.max(0, p.energy - Math.floor(energyDrain * saveMod));
        });

        // Record career stats for manager's team
        const managerTeam = engine.getTeam(engine.manager.teamId);
        if (managerTeam) {
            managerTeam.squad.forEach(p => {
                if (!p.isTitular) return;
                initCareerStats(p);
                const goals = p._matchGoals || 0;
                const assists = 0; // tracked via scorers
                const cards = events.cards?.filter(c => c.player === p.name).length || 0;
                const isMotm = events.motm?.name === p.name;
                recordMatchStats(p, goals, assists, cards, isMotm);
                delete p._matchGoals;
            });
            // Record assists from scorers
            (events.scorers || []).forEach(s => {
                if (s.assist) {
                    const assistP = managerTeam.squad.find(p => p.name === s.assist);
                    if (assistP) {
                        initCareerStats(assistP);
                        assistP.career.totalAssists++;
                        assistP.career.seasonAssists++;
                    }
                }
            });
            // Leader trait: +3 moral on win
            if (homeGoals !== awayGoals) {
                const isWin = (homeId === engine.manager.teamId && homeGoals > awayGoals) || (awayId === engine.manager.teamId && awayGoals > homeGoals);
                if (isWin) {
                    managerTeam.squad.filter(p => hasTrait(p, 'leader')).forEach(leader => {
                        managerTeam.squad.forEach(p => { p.moral = Math.min(100, (p.moral || 50) + 2); });
                        events.textLog.push({ minute: 90, text: `👔 ${leader.name} inspira o vestiário!` });
                    });
                }
            }
        }

        // Reset team talk modifiers after match
        engine.teamTalkModifiers = { ata: 1.0, def: 1.0 };

        return { homeGoals, awayGoals, events };
    }
}
