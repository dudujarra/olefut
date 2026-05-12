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

import { TACTICS } from '../engine/ManagerSystems';
import { drawCard } from '../engine/MatchEventsDeck.js';
import { TACTIC_COUNTERS, TACTIC_NARRATION, getFormModifier } from '../engine/PlayerDevelopment';
import { getDifficulty, calcOpponentBoost } from '../engine/systems/DifficultyModes.js';
import { getRookieHandicapFromEngine } from '../engine/RookieHandicap.js';
import { getModifiersForMatch as getWinStreakBonus, recordResult as recordWinStreak } from '../engine/WinStreakModifierSystem.js';
import { getAtmosphere } from '../engine/BrazilianAtmosphere.js';
import { getClubVoice } from '../engine/ClubVoiceSystem.js';
import { getTraitMatchModifier, hasTrait, initCareerStats, recordMatchStats, getGoalConversionBonus, getDefenseSectorBonus, getSetPieceBonus, getPenaltySaveBonus, getPenaltyConversionBonus } from '../engine/PlayerTraits';
import { recordNpcResult } from '../engine/NpcTacticAdvisor';
import { npcFeedMatchResult } from './learning/NpcManagerAI.js';

import { rng as systemRng } from '../engine/rng.js';
import { emitGameEvent, GameEvents } from '../audio/EventBus.js';

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

        // Tactic setup — SPEC-131: NPCs usam tática dinâmica (não mais hardcoded 'normal')
        const homeTactic = homeId === engine.manager.teamId
            ? engine.currentTactic
            : (homeTeam?.npcTacticState?.currentTactic || 'normal');
        const awayTactic = awayId === engine.manager.teamId
            ? engine.currentTactic
            : (awayTeam?.npcTacticState?.currentTactic || 'normal');
        const tactic = TACTICS[homeTactic] || TACTICS.normal;
        const oppTactic = TACTICS[awayTactic] || TACTICS.normal;

        // Apply tactic modifiers to BOTH teams' sectors
        // BUG-095: previously only manager's team got sector-level modifiers,
        // which caused double-application in xG formula for manager + zero application for NPCs.
        // Now: all teams get tactic mods applied here; xG uses raw sectors.
        const isManagerHome = homeId === engine.manager.teamId;
        const isManagerAway = awayId === engine.manager.teamId;
        // Home team: tactic + teamTalk (if manager)
        const homeTTAta = isManagerHome ? engine.teamTalkModifiers.ata : 1.0;
        const homeTTDef = isManagerHome ? engine.teamTalkModifiers.def : 1.0;
        homeSectors.attack = Math.floor(homeSectors.attack * tactic.ataModifier * homeTTAta);
        homeSectors.defense = Math.floor(homeSectors.defense * tactic.defModifier * homeTTDef);
        // Away team: tactic + teamTalk (if manager)
        const awayTTAta = isManagerAway ? engine.teamTalkModifiers.ata : 1.0;
        const awayTTDef = isManagerAway ? engine.teamTalkModifiers.def : 1.0;
        awaySectors.attack = Math.floor(awaySectors.attack * oppTactic.ataModifier * awayTTAta);
        awaySectors.defense = Math.floor(awaySectors.defense * oppTactic.defModifier * awayTTDef);

        // Tactic counter modifier
        const homeCounterMod = TACTIC_COUNTERS[homeTactic]?.[awayTactic] || 1.0;
        const awayCounterMod = TACTIC_COUNTERS[awayTactic]?.[homeTactic] || 1.0;

        // Match condition
        const cond = engine.matchCondition || { ataModifier: 1, defModifier: 1, energyModifier: 1 };

        // Narration templates
        const homeNarr = TACTIC_NARRATION[homeTactic] || TACTIC_NARRATION.normal;
        const awayNarr = TACTIC_NARRATION[awayTactic] || TACTIC_NARRATION.normal;

        // SPEC-125 BUG-072: AI counter-tactic — adversários adaptam vs streak.
        // ==========================================
        // DDA (Dynamic Difficulty) — Flow Channel (§1.2)
        // SPEC-147: calibrated boost curve (deep soak data: max win streak 18, max loss 11)
        // ==========================================
        let opponentBoost = 1.0;

        if ((isManagerHome || isManagerAway) && engine.managerStats?.currentStreak !== undefined) {
            const streak = engine.managerStats.currentStreak || 0;
            const difficulty = getDifficulty();
            // Hard/Sinistro: rubber-banding only applies upward (boost opponent on win streaks)
            if (difficulty.id === 'hard' || difficulty.id === 'sinistro') {
                opponentBoost = streak > 0 ? calcOpponentBoost(streak) : 1.0;
            } else {
                opponentBoost = calcOpponentBoost(streak);
            }
        }

        // SPEC-A5: Rookie Handicap — multiplica opponentBoost nas 3 primeiras
        // partidas da 1ª temporada (decay 0.90 → 0.93 → 0.97 → 1.0).
        // Só afeta o oponente do manager humano.
        if (isManagerHome || isManagerAway) {
            const rookieMult = getRookieHandicapFromEngine(engine);
            opponentBoost *= rookieMult;
        }

        // SPEC-F2.1: Win Streak Bonus — aplica attrBonus aos sectors do manager
        // se feature flag ENABLE_WIN_STREAK ativa.
        if (isManagerHome) {
            const bonus = getWinStreakBonus(engine.manager?.teamId || 0);
            if (bonus.attrBonus > 0) {
                homeSectors.attack = Math.floor(homeSectors.attack + bonus.attrBonus);
                homeSectors.defense = Math.floor(homeSectors.defense + bonus.attrBonus);
            }
        } else if (isManagerAway) {
            const bonus = getWinStreakBonus(engine.manager?.teamId || 0);
            if (bonus.attrBonus > 0) {
                awaySectors.attack = Math.floor(awaySectors.attack + bonus.attrBonus);
                awaySectors.defense = Math.floor(awaySectors.defense + bonus.attrBonus);
            }
        }

        // Apply DDA physical sector boost (if applies)
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
        const pickRandom = (arr) => arr.length > 0 ? arr[Math.floor(systemRng() * arr.length)] : null;

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
        // SPEC-F2.4: atmosphere pre-match para Manager mode
        if (isManagerHome || isManagerAway) {
            const atmoSeed = (engine.currentWeek || 0) + (homeId || 0);
            const preMatch = getAtmosphere('pre_match', atmoSeed);
            if (preMatch.flavorString) {
                events.textLog.push({ minute: 0, text: preMatch.flavorString });
            }
            // SPEC-F3.3: club voice na entrada do estádio (mandante)
            const clubEntry = getClubVoice(homeTeam?.name, 'stadium_entry', atmoSeed);
            if (clubEntry) {
                events.textLog.push({ minute: 0, text: clubEntry });
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

        // Base λ (home xG) and μ (away xG)
        // rockwall reduz xG do adversário (defende melhor)
        let lambda = BASE_XG_HOME * homeAttackStr * (awayDefenseStr * awayRockwallMod) * homeMoralFactor * homeCounterMod;
        let mu = BASE_XG_AWAY * awayAttackStr * (homeDefenseStr * homeRockwallMod) * awayMoralFactor * awayCounterMod;

        // Apply DDA (Dynamic Difficulty) boost to bot if manager is on a streak
        if (isManagerHome) {
            mu *= opponentBoost;
        } else if (isManagerAway) {
            lambda *= opponentBoost;
        }

        // Cap expected goals to maintain realism (Poisson mean)
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

        // BUG-033 + SPEC-125: cap reduzido 12→8, scorelines mais realistas.
        const MAX_COMBINED_GOALS = 8;
        for (let minute = 1; minute <= 90; minute++) {
            if (homeGoals + awayGoals >= MAX_COMBINED_GOALS) break;

            // §9: Emit match phase at key intervals for procedural audio
            if (minute === 1) {
                try { emitGameEvent(GameEvents.MATCH_STARTED, { homeTeam: homeTeam.name, awayTeam: awayTeam.name }); } catch { /* event emit - non-critical */ }
            }

            const isHomeChance = systemRng() < homeChancePerMin;
            const isAwayChance = !isHomeChance && systemRng() < awayChancePerMin;

            // Filler narration every ~12 min
            if (minute % 12 === 0 && !isHomeChance && !isAwayChance) {
                const isHomeAttackingFiller = systemRng() > 0.5;
                const attTeamFiller = isHomeAttackingFiller ? homeTeam : awayTeam;
                const defTeamFiller = isHomeAttackingFiller ? awayTeam : homeTeam;
                const narrFiller = isHomeAttackingFiller ? homeNarr : awayNarr;
                const fillerTemplate = narrFiller.filler[Math.floor(systemRng() * narrFiller.filler.length)];
                events.textLog.push({
                    minute,
                    text: fillerTemplate.replace('{atk}', attTeamFiller.name).replace('{def}', defTeamFiller.name)
                });
            }

            if (isHomeChance || isAwayChance) {
                const isHomeAttacking = isHomeChance;
                const atkSectors = isHomeAttacking ? homeSectors : awaySectors;
                const defSectors = isHomeAttacking ? awaySectors : homeSectors;
                const attTeam = isHomeAttacking ? homeTeam : awayTeam;
                const defTeam = isHomeAttacking ? awayTeam : homeTeam;
                const narr = isHomeAttacking ? homeNarr : awayNarr;
                const attackers = isHomeAttacking ? homeAttackers : awayAttackers;

                if (isHomeAttacking) homeShots++; else awayShots++;

                // SPEC-144: set_piece_target — DEF/ATA alvo de bola parada também pode marcar
                // Nos minutos pós-escanteio (~30, ~60, ~85), incluir defenders nos candidatos
                const isSetPieceMinute = (minute % 30 === 0 && minute > 0);
                const scorerPool = isSetPieceMinute
                    ? [...attackers, ...((isHomeAttacking ? homeDefenders : awayDefenders))]
                    : attackers;
                const scorer = pickRandom(scorerPool);
                const formMod = scorer ? getFormModifier(scorer.form?.trend) : 1.0;
                const traitMod = scorer ? getTraitMatchModifier(scorer, minute, isManagerHome ? homeTactic : awayTactic, false) : 1.0;
                // SPEC-144: poacher (+25% conv) + set_piece_target (+20% se minuto de bola parada)
                const poacherMod = getGoalConversionBonus(scorer);
                const setPieceMod = (isSetPieceMinute && scorer) ? getSetPieceBonus(scorer) : 1.0;

                // Adjust shotPower threshold so average conversion = CONVERSION_RATE
                // §2: PRD pity bonus — +10% per consecutive miss (caps at +50%)
                const pityBonus = isHomeAttacking
                    ? Math.min(0.5, homeMissStreak * 0.10)
                    : Math.min(0.5, awayMissStreak * 0.10);
                const shotPower = atkSectors.attack * cond.ataModifier * systemRng() * formMod * traitMod * poacherMod * setPieceMod * (1 + pityBonus);
                const saveChance = defSectors.goalkeeper * systemRng() * 0.8; 

                const chanceTemplate = narr.chance[Math.floor(systemRng() * narr.chance.length)];
                const goalTemplate = narr.goal[Math.floor(systemRng() * narr.goal.length)];
                const saveTemplate = narr.save[Math.floor(systemRng() * narr.save.length)];
                const scorerName = scorer ? scorer.name : attTeam.name;

                // SPEC-137: Card Deck integration for emergent narrative
                let chanceText = chanceTemplate.replace('{atk}', attTeam.name).replace('{def}', defTeam.name);
                let goalText = goalTemplate.replace('{atk}', scorerName).replace('{def}', defTeam.name);
                let saveText = saveTemplate.replace('{atk}', attTeam.name).replace('{def}', defTeam.name);
                
                if (scorer && systemRng() < 0.15) { // 15% of chances trigger a special narrative card
                    const position = scorer.position || 'ATA';
                    const renown = Math.floor(Math.max(0, (scorer.ovr || 50) - 50) / 10);
                    const card = drawCard(position, renown);
                    if (card && card.options && card.options.length > 0) {
                        const option = card.options[Math.floor(systemRng() * card.options.length)];
                        const tierEmoji = card.tier === 'legendary' ? '🌟' : card.tier === 'rare' ? '🔥' : card.tier === 'uncommon' ? '⚡' : '🃏';
                        chanceText = `${tierEmoji} [${card.tier.toUpperCase()}] ${scorer.name}: ${card.text} → "${option.label}"`;
                        goalText = option.successText;
                        saveText = option.failText;
                    }
                }

                events.textLog.push({ minute, text: chanceText });

                if (shotPower > saveChance) {
                    // GOAL
                    if (isHomeAttacking) {
                        homeGoals++;
                        events.home.push({ minute, type: 'goal', scorer: scorer?.name });
                    } else {
                        awayGoals++;
                        events.away.push({ minute, type: 'goal', scorer: scorer?.name });
                    }

                    const assistPlayer = pickRandom(attackers.filter(p => p !== scorer));
                    const assistText = assistPlayer ? ` (assist: ${assistPlayer.name})` : '';
                    // SPEC-144: indicar bola parada se DEF marcou com trait
                    const setPieceLabel = (scorer?.position === 'DEF' && scorer?.traits?.includes('set_piece_target'))
                        ? ' 🎯 (Alvo de Bola Parada!)' : '';

                    events.textLog.push({
                        minute,
                        text: `⚽ ${goalText}${assistText}${setPieceLabel} (${homeGoals} x ${awayGoals})`
                    });

                    events.scorers.push({ minute, name: scorerName, team: attTeam.name, assist: assistPlayer?.name });

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
                    events.textLog.push({
                        minute,
                        text: saveText
                    });
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
                    events.textLog.push({ minute, text: `🟨 Falta dura de ${offender.name}! Cartão amarelo para o ${pStyle || 'jogador'} do ${foulTeam.name}!` });
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
                    events.textLog.push({ minute, text: `😱 GOL CONTRA! ${name} (${unluckyTeam.name}) desviou para o próprio gol! (${homeGoals} x ${awayGoals})` });
                    if (unluckyDef) performanceMap[unluckyDef.id] = (performanceMap[unluckyDef.id] || 0) - 3;

                } else if (eventRoll < 0.55) {
                    // VAR CONTROVERSY (~25% of surprise events)
                    const side = systemRng() > 0.5 ? 'home' : 'away';
                    const varDecisions = ['gol anulado por impedimento', 'pênalti marcado após revisão', 'cartão vermelho direto após revisão'];
                    const decision = varDecisions[Math.floor(systemRng() * varDecisions.length)];
                    const affectedTeam = side === 'home' ? homeTeam : awayTeam;
                    events.textLog.push({ minute, text: `📺 VAR! ${decision} para ${affectedTeam.name}!` });
                    // VAR penalty: 70% conversion
                    if (decision.includes('pênalti') && systemRng() < 0.70) {
                        if (side === 'home') { homeGoals++; } else { awayGoals++; }
                        events.textLog.push({ minute, text: `⚽ GOOOOL de pênalti! (${homeGoals} x ${awayGoals})` });
                    }

                } else if (eventRoll < 0.80) {
                    // KEY PLAYER INJURY mid-match (~25% of surprise events)
                    const injTeam = systemRng() > 0.5 ? homeTeam : awayTeam;
                    const candidates = (injTeam.squad || []).filter(p => p.isTitular && !p.injury);
                    const injured = pickRandom(candidates);
                    if (injured) {
                        injured.injury = { name: 'Lesão muscular', weeksLeft: 2 + Math.floor(systemRng() * 4), emoji: '🤕' };
                        events.textLog.push({ minute, text: `🤕 ${injured.name} (${injTeam.name}) saiu de maca! Lesão durante o jogo!` });
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
                        const pStyle = expelled.playstyle ? ` (Conhecido por ser ${expelled.playstyle})` : '';
                        events.textLog.push({ minute, text: `🟥 EXPULSO! ${expelled.name}${pStyle} do ${redTeam.name} recebeu vermelho direto por agressão!` });
                        performanceMap[expelled.id] = (performanceMap[expelled.id] || 0) - 4;
                    }
                }
            }
        }

        // Penalties
        if (isCup && homeGoals === awayGoals) {
            events.textLog.push({ minute: 90, text: `⚖️ Empate! Decisão nos Pênaltis!` });

            // SPEC-144: penalty_stopper e penalty_king afetam resultado
            const homeGol = (homeTeam.squad || []).find(p => p.position === 'GOL' && p.isTitular);
            const awayGol = (awayTeam.squad || []).find(p => p.position === 'GOL' && p.isTitular);
            const homeTaker = pickRandom([...homeAttackers]) || null;
            const awayTaker = pickRandom([...awayAttackers]) || null;

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
                events.textLog.push({ minute: 91, text: `🏆 ${homeTeam.name} VENCE nos pênaltis!${note}` });
            } else {
                awayGoals++;
                const note = awayGol?.traits?.includes('penalty_stopper') ? ' (Pegador de Pênalti!)' : '';
                events.textLog.push({ minute: 91, text: `🏆 ${awayTeam.name} VENCE nos pênaltis!${note}` });
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
        const energyDrain = Math.floor(15 + systemRng() * 10) * (cond.energyModifier || 1);
        [...(homeTeam.squad || []), ...(awayTeam.squad || [])].filter(p => p.isTitular).forEach(p => {
            const saveMod = hasTrait(p, 'workhorse') ? 0.7 : 1.0;
            p.energy = Math.max(0, p.energy - Math.floor(energyDrain * saveMod));
        });

        // Record career stats for manager's team
        // BUG-082: also record for bench players if they somehow scored (_matchGoals > 0)
        const managerTeam = engine.getTeam(engine.manager.teamId);
        if (managerTeam) {
            managerTeam.squad.forEach(p => {
                if (!p.isTitular && !(p._matchGoals > 0)) return;
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
                    const leaders = managerTeam.squad.filter(p => hasTrait(p, 'leader'));
                    if (leaders.length > 0) {
                        // BUG-FIX: Apply moral boost ONCE regardless of leader count (was N× before)
                        managerTeam.squad.forEach(p => { p.moral = Math.min(100, (p.moral || 50) + 2); });
                        events.textLog.push({ minute: 90, text: `👔 ${leaders[0].name} inspira o vestiário!` });
                    }
                }
            }
        }

        // Reset team talk modifiers after match
        engine.teamTalkModifiers = { ata: 1.0, def: 1.0 };

        // SPEC-131: registra resultado nos estados NPC para próximo pivot
        const homeResult = homeGoals > awayGoals ? 'W' : homeGoals < awayGoals ? 'L' : 'D';
        const awayResult = awayGoals > homeGoals ? 'W' : awayGoals < homeGoals ? 'L' : 'D';
        if (homeTeam && homeId !== engine.manager.teamId && homeTeam.npcTacticState) {
            homeTeam.npcTacticState = recordNpcResult(homeTeam.npcTacticState, homeResult);
            // MARL Fase 6: feed emotional engine with match result
            try { npcFeedMatchResult(homeTeam, homeResult, engine); } catch { /* defensive */ }
        }
        if (awayTeam && awayId !== engine.manager.teamId && awayTeam.npcTacticState) {
            awayTeam.npcTacticState = recordNpcResult(awayTeam.npcTacticState, awayResult);
            // MARL Fase 6: feed emotional engine with match result
            try { npcFeedMatchResult(awayTeam, awayResult, engine); } catch { /* defensive */ }
        }
        // Track last opponent for tactic advisor context
        if (!engine._lastNpcOpponent) engine._lastNpcOpponent = {};
        if (homeId !== engine.manager.teamId) engine._lastNpcOpponent[homeId] = awayId;
        if (awayId !== engine.manager.teamId) engine._lastNpcOpponent[awayId] = homeId;

        // §9: Emit match end for procedural audio
        try {
            const managerResult = isManagerHome
                ? (homeGoals > awayGoals ? 'victory' : homeGoals < awayGoals ? 'defeat' : 'draw')
                : isManagerAway
                    ? (awayGoals > homeGoals ? 'victory' : awayGoals < homeGoals ? 'defeat' : 'draw')
                    : 'neutral';
            emitGameEvent(GameEvents.MATCH_ENDED, { result: managerResult, homeGoals, awayGoals });
        } catch { /* event emit - non-critical */ }

        return { homeGoals, awayGoals, events };
    }
}
