/**
 * MatchSimulator — Extracted from engine.playMatch (AKITA-RFCT-004)
 *
 * Status: ACTIVE (PR-0.4 — Extract Class refactor)
 *
 * Responsabilidade: simular 90 minutos de partida + cards + MOTM + energy drain.
 *
 * Invariante RFCT-004:
 * - Mesma assinatura comportamental que engine.playMatch antes do refactor
 * - Mesma ordem de chamadas RNG (systemRng)
 * - Golden master snapshot deve ser idêntico
 *
 * Não muta engine além do que playMatch original mutava:
 * - team.squad[].energy (drain pós-match)
 * - team.squad[].moral (leader trait win bonus)
 * - team.squad[].career stats (recordMatchStats)
 * - engine.teamTalkModifiers (reset)
 */

import { FORMATION_COUNTERS } from '../engine/tactical/TacticCounters.js';
import { getFormModifier } from '../engine/systems/FormSystem.js';
import { MatchNarrator } from './MatchNarrator.js';
import { getDifficulty } from '../engine/systems/DifficultyModes.js';
import { getAtmosphere } from '../engine/BrazilianAtmosphere.js';
import { getClubVoice } from '../engine/ClubVoiceSystem.js';
import { getTraitMatchModifier, getGoalConversionBonus, getDefenseSectorBonus, getSetPieceBonus, getPenaltySaveBonus, getPenaltyConversionBonus } from '../engine/PlayerTraits';

import { rng as systemRng } from '../engine/rng.js';
import { emitGameEvent, GameEvents } from '../audio/EventBus.js';
import { processMatchCards } from '../engine/DisciplineSystem.js';
import { spatialEngine } from '../engine/SpatialEngine.js';
import { DeepTacticalEngine } from '../engine/tactical/DeepTacticalEngine.js';
import { MatchEffectsPipeline } from '../engine/systems/MatchEffectsPipeline.js';
import { shouldTriggerMidMatch, getMidMatchCardDerbyAware } from '../engine/MidMatchManagerDeck.js';
import { resolveMOTM, applyEnergyDrain, recordCareerStats, applyLeaderBoost, settleBicho, feedNpcResults, emitMatchEnd } from './MatchPostMatch.js';
export class MatchSimulator {
    constructor() {
        this._tacticalEngine = new DeepTacticalEngine();
    }
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
        return this.simulateInterval(engine, homeId, awayId, 1, 90, null, isCup);
    }

    /**
     * Simula um intervalo de tempo da partida.
     * Útil para recálculo tático em tempo real.
     * @param {boolean} skipPostMatch - If true, skip energy drain, career stats, discipline, etc.
     *   Used for first-half simulation in split-sim mode.
     */
    simulateInterval(engine, homeId, awayId, startMin, endMin, baseResult = null, isCup = false, skipPostMatch = false) {
        const homeTeam = engine.getTeam(homeId);
        const awayTeam = engine.getTeam(awayId);

        const homeSectors = engine.getTeamSectors(homeId);
        const awaySectors = engine.getTeamSectors(awayId);

        this._tacticalEngine.initializeMatch(homeTeam, awayTeam);

        // Tactic setup and modifiers extraction via MatchEffectsPipeline
        const tacticData = {
            homeTactic: homeId === engine.manager.teamId ? engine.currentTactic : (homeTeam?.npcTacticState?.currentTactic || 'normal'),
            awayTactic: awayId === engine.manager.teamId ? engine.currentTactic : (awayTeam?.npcTacticState?.currentTactic || 'normal')
        };
        const { homeSectors: finalHomeSectors, awaySectors: finalAwaySectors, context: matchCtx } = MatchEffectsPipeline.applyEffects(engine, homeId, awayId, tacticData);
        
        homeSectors.attack = finalHomeSectors.attack;
        homeSectors.defense = finalHomeSectors.defense;
        awaySectors.attack = finalAwaySectors.attack;
        awaySectors.defense = finalAwaySectors.defense;

        const { tactic, oppTactic: _oppTactic, homeTactic, awayTactic, homeCounterMod, awayCounterMod, opponentBoost, homeClimateMod, awayClimateMod, weatherDrainMod, weatherEventText, isManagerMatch, predictabilityText, sideEffects } = matchCtx;

        // Apply pipeline side effects (mutations live HERE, not in the pipeline)
        if (sideEffects && engine.managerStats) {
            if (sideEffects.newTacticStreak !== null) engine.managerStats.tacticStreak = sideEffects.newTacticStreak;
            if (sideEffects.newLastTactic !== null) engine.managerStats.lastTactic = sideEffects.newLastTactic;
        }

        const isManagerHome = homeId === engine.manager.teamId;
        const isManagerAway = awayId === engine.manager.teamId;
        let homeGoals = baseResult ? baseResult.homeGoals : 0;
        let awayGoals = baseResult ? baseResult.awayGoals : 0;
        const events = baseResult ? JSON.parse(JSON.stringify(baseResult.events)) : { home: [], away: [], textLog: [], scorers: [], cards: [], motm: null };
        let homeShots = baseResult?.stats?.homeShots || 0;
        let awayShots = baseResult?.stats?.awayShots || 0;
        let homeSaves = baseResult?.stats?.homeSaves || 0;
        let awaySaves = baseResult?.stats?.awaySaves || 0;

        const homeAttackers = (homeTeam.squad || []).filter(p => p.isTitular && (p.position === 'ATA' || p.position === 'MEI') && !p.injury);
        const awayAttackers = (awayTeam.squad || []).filter(p => p.isTitular && (p.position === 'ATA' || p.position === 'MEI') && !p.injury);
        const homeDefenders = (homeTeam.squad || []).filter(p => p.isTitular && p.position === 'DEF' && !p.injury);
        const awayDefenders = (awayTeam.squad || []).filter(p => p.isTitular && p.position === 'DEF' && !p.injury);
        const homeScorerPoolSetPiece = homeAttackers.concat(homeDefenders);
        const awayScorerPoolSetPiece = awayAttackers.concat(awayDefenders);
        const pickRandom = (arr) => arr.length > 0 ? arr[Math.floor(systemRng() * arr.length)] : null;

        const homeMoral = (homeTeam.squad || []).reduce((s, p) => s + (p.moral || 50), 0) / (homeTeam.squad?.length || 1);
        const awayMoral = (awayTeam.squad || []).reduce((s, p) => s + (p.moral || 50), 0) / (awayTeam.squad?.length || 1);
        const homeMoralFactor = 0.8 + (homeMoral / 250);
        const awayMoralFactor = 0.8 + (awayMoral / 250);

        const cond = engine.matchCondition || { ataModifier: 1, defModifier: 1, energyModifier: 1 };
        const rawEvents = baseResult && baseResult.events._rawEvents ? [...baseResult.events._rawEvents] : [];

        if (isManagerMatch && startMin === 1) {
            rawEvents.push({ minute: 0, type: 'weather', weatherText: weatherEventText });
            if (predictabilityText) {
                rawEvents.push({ minute: 0, type: 'tactical_analysis', text: predictabilityText });
            }
            if (engine.matchCondition && engine.matchCondition.id !== 'normal') {
                rawEvents.push({ minute: 0, type: 'condition', name: engine.matchCondition.name });
            }
            rawEvents.push({ minute: 0, type: 'tactic', name: tactic.name });
            
            const atmoSeed = (engine.currentWeek || 0) + (homeId || 0);
            const preMatch = getAtmosphere('pre_match', atmoSeed);
            if (preMatch.flavorString) {
                rawEvents.push({ minute: 0, type: 'pre_match', text: preMatch.flavorString });
            }
            const clubEntry = getClubVoice(homeTeam?.name, 'stadium_entry', atmoSeed);
            if (clubEntry) {
                rawEvents.push({ minute: 0, type: 'club_entry', text: clubEntry });
            }
        }

        // Performance tracker for MOTM
        const performanceMap = {};

        // ==========================================
        // DIXON-COLES EXPECTED GOALS (xG) MODEL (§2)
        // ==========================================
        const BASE_XG_HOME = 1.45;
        const BASE_XG_AWAY = 1.15;
        const AVG_SECTOR = 60; // baseline for strength normalization

        // Attack & Defense Strengths (Alpha & Beta)
        // BUG-095: sectors already include tactic + teamTalk modifiers from L62-67.
        // Do NOT re-apply them here (was squaring the modifier effect).
        const homeAttackStr = homeSectors.attack / AVG_SECTOR;
        const awayDefenseStr = awaySectors.defense / AVG_SECTOR;

        const awayAttackStr = awaySectors.attack / AVG_SECTOR;
        const homeDefenseStr = homeSectors.defense / AVG_SECTOR;

        // SPEC-144: rockwall trait — +15% setor defensivo por DEF/GOL com trait
        const homeRockwallMod = getDefenseSectorBonus(homeTeam.squad);
        const awayRockwallMod = getDefenseSectorBonus(awayTeam.squad);

        // ==========================================
        // DEEP TACTICAL: SPATIAL ENGINE MODIFIERS
        // ==========================================
        const spatialData = spatialEngine.calculateSpatialMatchModifiers(homeTactic, homeTeam.squad, awayTactic, awayTeam.squad);
        if (isManagerMatch && spatialData.logs.length > 0) {
            spatialData.logs.forEach(logText => {
                rawEvents.push({ minute: 0, type: 'tactical_analysis', text: `🧠 Análise Espacial: ${logText}` });
            });
        }

        // Base λ (home xG) and μ (away xG)
        // rockwall reduz xG do adversário (defende melhor)
        let lambda = BASE_XG_HOME * homeAttackStr * (awayDefenseStr * awayRockwallMod) * homeMoralFactor * homeCounterMod * homeClimateMod * spatialData.homeXgMod;
        let mu = BASE_XG_AWAY * awayAttackStr * (homeDefenseStr * homeRockwallMod) * awayMoralFactor * awayCounterMod * awayClimateMod * spatialData.awayXgMod;

        // Tactical Formation Rock-Paper-Scissors (§2.14)
        const homeFormation = homeTeam?.formation || '4-3-3';
        const awayFormation = awayTeam?.formation || '4-3-3';
        const formAmp = getDifficulty().modifiers.formationCounterAmplifier || 1.0;
        const rawHomeFormMod = FORMATION_COUNTERS[homeFormation]?.[awayFormation] || 1.0;
        const rawAwayFormMod = FORMATION_COUNTERS[awayFormation]?.[homeFormation] || 1.0;
        // Amplify deviation from 1.0 (same logic as tactic counter)
        const homeFormationMod = 1.0 + (rawHomeFormMod - 1.0) * formAmp;
        const awayFormationMod = 1.0 + (rawAwayFormMod - 1.0) * formAmp;

        lambda *= homeFormationMod;
        mu *= awayFormationMod;

        // Apply DDA (Dynamic Difficulty) boost to bot if manager is on a streak
        if (isManagerHome) {
            mu *= opponentBoost;
        } else if (isManagerAway) {
            lambda *= opponentBoost;
        }

        // Cap expected goals to maintain realism (Poisson mean)
        // BUG-F2-02: NaN guard — if any upstream factor is NaN, fallback to base xG
        if (isNaN(lambda) || !isFinite(lambda)) lambda = BASE_XG_HOME;
        if (isNaN(mu) || !isFinite(mu)) mu = BASE_XG_AWAY;
        lambda = Math.max(0.1, Math.min(lambda, 5.0));
        mu = Math.max(0.1, Math.min(mu, 5.0));

        // Assuming a ~30% conversion rate, calculate expected chances
        const CONVERSION_RATE = 0.30;
        const expectedHomeChances = lambda / CONVERSION_RATE;
        const expectedAwayChances = mu / CONVERSION_RATE;

        // Poisson rate per minute
        const homeChancePerMin = expectedHomeChances / 90;
        const awayChancePerMin = expectedAwayChances / 90;

        // §2: PRD (Pseudo-Random Distribution) pity counters
        // After N consecutive missed chances, boost next chance's conversion
        let homeMissStreak = 0;
        let awayMissStreak = 0;
        const midMatchTriggered = new Set(); // track which minutes already drew a card

        // BUG-033 + SPEC-125: cap reduzido 12→8, scorelines mais realistas.
        const MAX_COMBINED_GOALS = 8;
        for (let minute = startMin; minute <= endMin; minute++) {
            if (homeGoals + awayGoals >= MAX_COMBINED_GOALS) break;

            // §9: Emit match phase at key intervals for procedural audio
            if (minute === 1) {
                try { emitGameEvent(GameEvents.MATCH_STARTED, { homeTeam: homeTeam.name, awayTeam: awayTeam.name }); } catch { /* event emit - non-critical */ }
            }

            // DEEP TACTICAL ENGINE: Phase 4 Integration
            let isHomeChance = false;
            let isAwayChance = false;
            let tacticalBaseXG = 0.3; // Default 30% conversion baseline

            const tacticalEvent = this._tacticalEngine.tickMinute(homeTeam.squad, awayTeam.squad);
            if (tacticalEvent && tacticalEvent.type === 'shot') {
                if (tacticalEvent.team === 'home') {
                    isHomeChance = true;
                    tacticalBaseXG = tacticalEvent.xG;
                } else {
                    isAwayChance = true;
                    tacticalBaseXG = tacticalEvent.xG;
                }
            } else {
                // Fallback Poisson (scaled down) to guarantee matches don't end 0-0 if tactical engine stalls
                isHomeChance = systemRng() < (homeChancePerMin * 0.4);
                isAwayChance = !isHomeChance && systemRng() < (awayChancePerMin * 0.4);
            }

            // Filler narration every ~12 min
            if (minute % 12 === 0 && !isHomeChance && !isAwayChance) {
                const isHomeAttackingFiller = systemRng() > 0.5;
                const attTeamFiller = isHomeAttackingFiller ? homeTeam : awayTeam;
                const defTeamFiller = isHomeAttackingFiller ? awayTeam : homeTeam;
                if (isManagerMatch) {
                    rawEvents.push({
                        minute,
                        type: 'filler',
                        isHomeAttacking: isHomeAttackingFiller,
                        attTeam: attTeamFiller.name,
                        defTeam: defTeamFiller.name
                    });
                }
            }

            // SPEC-B2: MidMatchManagerDeck — decision cards at key minutes
            if (isManagerMatch && shouldTriggerMidMatch(minute, midMatchTriggered)) {
                // ~40% chance per eligible minute → ~2 cards per match
                if (systemRng() < 0.40) {
                    const isDerby = matchCtx.isDerby || false;
                    const cardSeed = (engine.currentWeek || 0) * 90 + minute;
                    const card = getMidMatchCardDerbyAware(minute, isDerby, cardSeed);
                    if (card) {
                        midMatchTriggered.add(minute);
                        rawEvents.push({
                            minute,
                            type: 'mid_match_card',
                            cardId: card.id,
                            text: card.text,
                            options: card.options,
                        });
                    }
                }
            }

            if (isHomeChance || isAwayChance) {
                const isHomeAttacking = isHomeChance;
                const atkSectors = isHomeAttacking ? homeSectors : awaySectors;
                const defSectors = isHomeAttacking ? awaySectors : homeSectors;
                const attTeam = isHomeAttacking ? homeTeam : awayTeam;
                const defTeam = isHomeAttacking ? awayTeam : homeTeam;
                const attackers = isHomeAttacking ? homeAttackers : awayAttackers;

                if (isHomeAttacking) homeShots++; else awayShots++;

                // SPEC-144: set_piece_target — DEF/ATA alvo de bola parada também pode marcar
                // Nos minutos pós-escanteio (~30, ~60, ~85), incluir defenders nos candidatos
                const isSetPieceMinute = (minute % 30 === 0 && minute > 0);
                const scorerPool = isSetPieceMinute
                    ? (isHomeAttacking ? homeScorerPoolSetPiece : awayScorerPoolSetPiece)
                    : attackers;
                const scorer = pickRandom(scorerPool);
                const gkPool = (defTeam.squad || []).filter(p => p.isTitular && p.position === 'GOL' && !p.injury);
                const keeper = pickRandom(gkPool);

                const formMod = scorer ? getFormModifier(scorer.form?.trend) : 1.0;
                const traitMod = scorer ? getTraitMatchModifier(scorer, minute, isManagerHome ? homeTactic : awayTactic, false) : 1.0;
                // SPEC-144: poacher (+25% conv) + set_piece_target (+20% se minuto de bola parada)
                const poacherMod = getGoalConversionBonus(scorer);
                const setPieceMod = (isSetPieceMinute && scorer) ? getSetPieceBonus(scorer) : 1.0;

                const isDerby = engine.matchCondition && engine.matchCondition.id === 'derby';
                const scorerTransientFatigue = spatialEngine.getTransientFatigueModifier(scorer, minute);
                const scorerCognitiveMod = spatialEngine.getCognitiveModifier(scorer, minute, isDerby);
                
                const keeperTransientFatigue = spatialEngine.getTransientFatigueModifier(keeper, minute);
                const keeperCognitiveMod = spatialEngine.getCognitiveModifier(keeper, minute, isDerby);

                // Adjust shotPower threshold so average conversion = CONVERSION_RATE
                // §2: PRD pity bonus — +10% per consecutive miss (caps at +50%)
                const pityBonus = isHomeAttacking
                    ? Math.min(0.5, homeMissStreak * 0.10)
                    : Math.min(0.5, awayMissStreak * 0.10);
                // bigMatch: 10-20 scale. In big matches (derby, cup, last 5 weeks), boosts/penalizes conversion
                const seasonWeek = ((engine.currentWeek - 1) % 38) + 1;
                const isBigMatch = isDerby || isCup || seasonWeek >= 34;
                let bigMatchMod = 1.0;
                if (isBigMatch && scorer?.bigMatch != null) {
                    // 10 = -10% (cracks under pressure), 15 = neutral, 20 = +15% (thrives)
                    bigMatchMod = 1.0 + (scorer.bigMatch - 15) * 0.03;
                }

                const finalScorerMod = formMod * traitMod * poacherMod * setPieceMod * scorerTransientFatigue * scorerCognitiveMod * bigMatchMod;
                
                // DEEP TACTICAL ENGINE: Blend spatial xG with traditional sector math
                const tacticalMod = (tacticalBaseXG / 0.3); // Ratio of actual xG vs 30% base
                const shotPower = atkSectors.attack * cond.ataModifier * systemRng() * finalScorerMod * (1 + pityBonus) * tacticalMod;
                
                const finalKeeperMod = keeperTransientFatigue * keeperCognitiveMod;
                const saveChance = defSectors.goalkeeper * systemRng() * 0.8 * finalKeeperMod; 

                const scorerName = scorer ? scorer.name : attTeam.name;
                const isGoal = shotPower > saveChance;
                let assistPlayer = null;

                if (isGoal) {
                    if (isHomeAttacking) {
                        homeGoals++;
                        events.home.push({ minute, type: 'goal', scorer: scorer?.name });
                    } else {
                        awayGoals++;
                        events.away.push({ minute, type: 'goal', scorer: scorer?.name });
                    }

                    // To avoid inline filter overhead for assist player
                    const possibleAssists = [];
                    for (let i = 0; i < attackers.length; i++) {
                        if (attackers[i] !== scorer) possibleAssists.push(attackers[i]);
                    }
                    assistPlayer = pickRandom(possibleAssists);

                    events.scorers.push({ minute, name: scorerName, team: attTeam.name, assist: assistPlayer?.name });
                }

                if (isManagerMatch) {
                    const isSetPieceScorer = (scorer?.position === 'DEF' && scorer?.traits?.includes('set_piece_target'));
                    rawEvents.push({
                        minute,
                        type: 'chance',
                        isGoal,
                        isHomeAttacking,
                        attTeam: attTeam.name,
                        defTeam: defTeam.name,
                        scorerName,
                        scorerPosition: scorer?.position,
                        scorerOvr: scorer?.ovr || 50,
                        assistName: assistPlayer?.name,
                        isSetPiece: isSetPieceScorer,
                        homeGoals,
                        awayGoals
                    });
                }

                if (isGoal) {

                    // §9: Emit goal event for procedural audio
                    try {
                        emitGameEvent(GameEvents.GOAL_SCORED, {
                            minute, scorer: scorerName, team: attTeam.name,
                            byPlayer: isManagerHome === isHomeAttacking,
                            moment: minute > 75 ? 'late' : minute < 15 ? 'early' : 'normal'
                        });
                    } catch { /* event emit - non-critical */ }

                    // Track performance
                    if (scorer) {
                        performanceMap[scorer.id] = (performanceMap[scorer.id] || 0) + 3;
                        scorer._matchGoals = (scorer._matchGoals || 0) + 1;
                    }
                    // §2: PRD reset on goal
                    if (isHomeAttacking) homeMissStreak = 0; else awayMissStreak = 0;
                    if (assistPlayer) {
                        performanceMap[assistPlayer.id] = (performanceMap[assistPlayer.id] || 0) + 2;
                    }
                } else {
                    // SAVE
                    if (isHomeAttacking) { awaySaves++; homeMissStreak++; } else { homeSaves++; awayMissStreak++; }
                }
            }

            // SPEC-148: Playstyle-driven Card System
            // Sorteia um jogador em campo para uma potencial falta
            const foulTeam = systemRng() > 0.5 ? homeTeam : awayTeam;
            const foulCandidates = (foulTeam.squad || []).filter(p => p.isTitular && !p.injury);
            const offender = pickRandom(foulCandidates);
            
            if (offender) {
                // Base chance 1.5% - Ajustado com base no temperamento
                let cardChance = 0.015;
                const pStyle = offender.playstyle || '';
                
                if (['Caneleiro', 'Gladiador', 'Sanguíneo', 'Provocador', 'Raçudo', 'Catimbeiro', 'Cai-Cai'].includes(pStyle)) {
                    cardChance = 0.035; // Alta chance de cartão
                } else if (['Fairplay', 'Elegante', 'Maestro Frio', 'Discreto'].includes(pStyle)) {
                    cardChance = 0.003; // Raramente toma cartão
                }

                // Defenders e Goleiros têm um multiplicador natural maior por causa de faltas táticas
                if (offender.position === 'DEF') cardChance *= 1.3;

                if (systemRng() < cardChance) {
                    events.cards.push({ minute, player: offender.name, team: foulTeam.name, type: 'yellow' });
                    if (isManagerMatch) rawEvents.push({ minute, type: 'card', player: offender.name, team: foulTeam.name, pStyle });
                    performanceMap[offender.id] = (performanceMap[offender.id] || 0) - 1;
                }
            }

            // ══════════════════════════════════════════
            // AUDIT-FIX #B: Surprise Events — SPEC-102 Fun Score booster
            // Rare dramatic events (~0.5% per minute ≈ 1 per 2-3 matches)
            // ══════════════════════════════════════════
            if (systemRng() < 0.005 && homeGoals + awayGoals < MAX_COMBINED_GOALS) {
                const eventRoll = systemRng();

                if (eventRoll < 0.30) {
                    // OWN GOAL (~30% of surprise events)
                    const unluckyTeam = systemRng() > 0.5 ? homeTeam : awayTeam;
                    const unluckyDef = pickRandom(unluckyTeam === homeTeam ? homeDefenders : awayDefenders);
                    const name = unluckyDef?.name || unluckyTeam.name;
                    if (unluckyTeam === homeTeam) { awayGoals++; } else { homeGoals++; }
                    if (isManagerMatch) rawEvents.push({ minute, type: 'own_goal', unluckyDefName: name, unluckyTeamName: unluckyTeam.name, homeGoals, awayGoals });
                    if (unluckyDef) performanceMap[unluckyDef.id] = (performanceMap[unluckyDef.id] || 0) - 3;

                } else if (eventRoll < 0.55) {
                    // VAR CONTROVERSY (~25% of surprise events)
                    const side = systemRng() > 0.5 ? 'home' : 'away';
                    const varDecisions = ['gol anulado por impedimento', 'pênalti marcado após revisão', 'cartão vermelho direto após revisão'];
                    const decision = varDecisions[Math.floor(systemRng() * varDecisions.length)];
                    const affectedTeam = side === 'home' ? homeTeam : awayTeam;
                    let isVarGoal = false;
                    // VAR penalty: 70% conversion
                    if (decision.includes('pênalti') && systemRng() < 0.70) {
                        isVarGoal = true;
                        if (side === 'home') { homeGoals++; } else { awayGoals++; }
                    }
                    if (isManagerMatch) rawEvents.push({ minute, type: 'var', decision, affectedTeamName: affectedTeam.name, isGoal: isVarGoal, homeGoals, awayGoals });

                } else if (eventRoll < 0.80) {
                    // KEY PLAYER INJURY mid-match (~25% of surprise events)
                    const injTeam = systemRng() > 0.5 ? homeTeam : awayTeam;
                    const candidates = (injTeam.squad || []).filter(p => p.isTitular && !p.injury);
                    const injured = pickRandom(candidates);
                    if (injured) {
                        injured.injury = { name: 'Lesão muscular', weeksLeft: 2 + Math.floor(systemRng() * 4), emoji: '🤕' };
                        if (isManagerMatch) rawEvents.push({ minute, type: 'injury', injuredName: injured.name, injTeamName: injTeam.name });
                        performanceMap[injured.id] = (performanceMap[injured.id] || 0) - 2;
                    }

                } else {
                    // RED CARD (~20% of surprise events)
                    const redTeam = systemRng() > 0.5 ? homeTeam : awayTeam;
                    // Múltipla seleção para favorecer a expulsão de jogadores agressivos
                    const redCandidates = (redTeam.squad || []).filter(p => p.isTitular && !p.injury);
                    let expelled = pickRandom(redCandidates);
                    
                    // Reroll mechanics: se for um jogador "Fairplay", tenta sortear de novo (2x)
                    for (let i=0; i<2; i++) {
                        if (expelled && ['Fairplay', 'Elegante', 'Maestro Frio', 'Discreto'].includes(expelled.playstyle)) {
                            expelled = pickRandom(redCandidates);
                        } else {
                            break;
                        }
                    }

                    if (expelled) {
                        events.cards.push({ minute, player: expelled.name, team: redTeam.name, type: 'red' });
                        if (isManagerMatch) rawEvents.push({ minute, type: 'red_card', expelledName: expelled.name, pStyle: expelled.playstyle, redTeamName: redTeam.name });
                        performanceMap[expelled.id] = (performanceMap[expelled.id] || 0) - 4;
                    }
                }
            }
        }

        // Penalties
        if (isCup && homeGoals === awayGoals) {
            if (isManagerMatch) rawEvents.push({ minute: 90, type: 'penalties_tie' });

            // SPEC-144: penalty_stopper e penalty_king afetam resultado
            const homeGol = (homeTeam.squad || []).find(p => p.position === 'GOL' && p.isTitular);
            const awayGol = (awayTeam.squad || []).find(p => p.position === 'GOL' && p.isTitular);
            const homeTaker = pickRandom(homeAttackers) || null;
            const awayTaker = pickRandom(awayAttackers) || null;

            // Base 50/50 ajustado por traits
            const homeSaveBonus  = getPenaltySaveBonus(homeGol);           // home GOL defende tiro away
            const awaySaveBonus  = getPenaltySaveBonus(awayGol);           // away GOL defende tiro home
            const homeKingBonus  = getPenaltyConversionBonus(homeTaker);   // home taker converte
            const awayKingBonus  = getPenaltyConversionBonus(awayTaker);   // away taker converte

            // Probabilidade de home vencer: normalizada entre traits
            const homeWinProb = (homeKingBonus / awaySaveBonus) /
                ((homeKingBonus / awaySaveBonus) + (awayKingBonus / homeSaveBonus));

            if (systemRng() < homeWinProb) {
                homeGoals++;
                const note = homeGol?.traits?.includes('penalty_stopper') ? ' (Pegador de Pênalti!)' : '';
                if (isManagerMatch) rawEvents.push({ minute: 91, type: 'penalties_win', teamName: homeTeam.name, note });
            } else {
                awayGoals++;
                const note = awayGol?.traits?.includes('penalty_stopper') ? ' (Pegador de Pênalti!)' : '';
                if (isManagerMatch) rawEvents.push({ minute: 91, type: 'penalties_win', teamName: awayTeam.name, note });
            }
        }

        // MOTM — Man of the Match (only at end of full match)
        if (!skipPostMatch) {
        events.motm = resolveMOTM(homeTeam, awayTeam, performanceMap, isManagerMatch, rawEvents);

        // Match stats
        events.stats = { homeShots, awayShots, homeSaves, awaySaves };

        } // end if (!skipPostMatch) — MOTM block

        // Energy drain + career + discipline + leader + bicho (only at end of full match)
        if (!skipPostMatch) {
        applyEnergyDrain(homeTeam, awayTeam, cond, weatherDrainMod);
        recordCareerStats(engine, events);

        // Elifoot Classic Feature: Discipline System (Suspensions for red/yellow cards)
        processMatchCards(events.cards, homeTeam);
        processMatchCards(events.cards, awayTeam);

        applyLeaderBoost(engine, homeId, awayId, homeGoals, awayGoals, isManagerMatch, rawEvents);
        settleBicho(engine, homeId, homeGoals, awayGoals, isManagerMatch, rawEvents);
        } // end if (!skipPostMatch) — energy, career, discipline, leader, bicho

        if (isManagerMatch) {
            events.textLog = MatchNarrator.translate(rawEvents, homeTeam, awayTeam, homeTactic, awayTactic);
            events._rawEvents = rawEvents; // SPEC-LIVE: preserve raw events for resimulation
        } else {
            events.textLog = []; // Stateless, zero GC pressure for Autoplay
        }

        // Match stats (always compute)
        if (!events.stats) events.stats = { homeShots, awayShots, homeSaves, awaySaves };

        // === POST-MATCH EFFECTS (only at end of full match) ===
        if (!skipPostMatch) {
            // Reset team talk modifiers after match
            engine.teamTalkModifiers = { ata: 1.0, def: 1.0 };

            // SPEC-131: NPC tactic state + MARL emotional engine
            feedNpcResults(engine, homeTeam, awayTeam, homeId, awayId, homeGoals, awayGoals);

            // §9: Emit match end for procedural audio
            emitMatchEnd(isManagerHome, isManagerAway, homeGoals, awayGoals);
        } // end if (!skipPostMatch)

        return { homeGoals, awayGoals, events, stats: { homeShots, awayShots, homeSaves, awaySaves } };
    }
}
