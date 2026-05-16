import { getDifficulty, calcOpponentBoost } from './DifficultyModes.js';
import { getRookieHandicapFromEngine } from '../RookieHandicap.js';
import { getModifiersForMatch as getWinStreakBonus } from '../WinStreakModifierSystem.js';
import { getMatchBonusBuff } from '../MatchBonusSystem.js';
import { getHomeAdvantageFromTickets } from '../TicketPricingSystem.js';
import { TACTICS } from '../ManagerSystems.js';
import { TACTIC_COUNTERS } from '../tactical/TacticCounters.js';
import { rng as systemRng } from '../rng.js';
import {
    CLIMATE_AWAY_PENALTY, CLIMATE_HOME_BONUS, CLIMATE_ALTITUDE_PENALTY,
    RAIN_POSSE_PENALTY, RAIN_COUNTER_BONUS, WEATHER_DRAIN,
} from '../constants.js';

export class MatchEffectsPipeline {
    /**
     * Applies all pre-match multipliers and modifiers to team sectors.
     * Returns the finalized sectors and match context variables.
     */
    static applyEffects(engine, homeId, awayId, tacticData = null) {
        const homeTeam = engine.getTeam(homeId);
        const awayTeam = engine.getTeam(awayId);

        const homeSectors = engine.getTeamSectors(homeId);
        const awaySectors = engine.getTeamSectors(awayId);

        const isManagerHome = homeId === engine.manager?.teamId;
        const isManagerAway = awayId === engine.manager?.teamId;
        const isManagerMatch = isManagerHome || isManagerAway;

        // Tactic setup
        const homeTactic = tacticData?.homeTactic || (isManagerHome
            ? engine.currentTactic
            : (homeTeam?.npcTacticState?.currentTactic || 'normal'));
        const awayTactic = tacticData?.awayTactic || (isManagerAway
            ? engine.currentTactic
            : (awayTeam?.npcTacticState?.currentTactic || 'normal'));

        const tactic = TACTICS[homeTactic] || TACTICS.normal;
        const oppTactic = TACTICS[awayTactic] || TACTICS.normal;

        // Apply Tactic + TeamTalk
        const homeTTAta = isManagerHome ? engine.teamTalkModifiers.ata : 1.0;
        const homeTTDef = isManagerHome ? engine.teamTalkModifiers.def : 1.0;
        homeSectors.attack = Math.floor(homeSectors.attack * tactic.ataModifier * homeTTAta);
        homeSectors.defense = Math.floor(homeSectors.defense * tactic.defModifier * homeTTDef);

        const awayTTAta = isManagerAway ? engine.teamTalkModifiers.ata : 1.0;
        const awayTTDef = isManagerAway ? engine.teamTalkModifiers.def : 1.0;
        awaySectors.attack = Math.floor(awaySectors.attack * oppTactic.ataModifier * awayTTAta);
        awaySectors.defense = Math.floor(awaySectors.defense * oppTactic.defModifier * awayTTDef);

        // Predictability Penalty (Pure — reads engine state, returns side effects)
        let predictabilityText = null;
        let newTacticStreak = null;
        let newLastTactic = null;
        if (isManagerMatch) {
            const manTactic = isManagerHome ? homeTactic : awayTactic;
            const oldStreak = engine.managerStats?.tacticStreak || 0;
            const oldLastTactic = engine.managerStats?.lastTactic;
            
            if (oldLastTactic === manTactic) {
                newTacticStreak = oldStreak + 1;
            } else {
                newTacticStreak = 1;
            }
            newLastTactic = manTactic;

            if (newTacticStreak > 5) {
                // 15% penalty for every week over 5
                const penaltyMult = Math.max(0.60, 1.0 - ((newTacticStreak - 5) * 0.15));
                if (isManagerHome) {
                    homeSectors.attack = Math.floor(homeSectors.attack * penaltyMult);
                    homeSectors.defense = Math.floor(homeSectors.defense * penaltyMult);
                } else {
                    awaySectors.attack = Math.floor(awaySectors.attack * penaltyMult);
                    awaySectors.defense = Math.floor(awaySectors.defense * penaltyMult);
                }
                predictabilityText = `👁️ O oponente 'leu' sua tática! (Penalidade por monotonia tática: ${Math.round((1.0 - penaltyMult) * 100)}%)`;
            }
        }

        // Tactic Counter Amplifier
        const tacticAmp = getDifficulty().modifiers.tacticCounterAmplifier || 1.0;
        const rawHomeCounter = TACTIC_COUNTERS[homeTactic]?.[awayTactic] || 1.0;
        const rawAwayCounter = TACTIC_COUNTERS[awayTactic]?.[homeTactic] || 1.0;
        const homeCounterMod = 1.0 + (rawHomeCounter - 1.0) * tacticAmp;
        const awayCounterMod = 1.0 + (rawAwayCounter - 1.0) * tacticAmp;

        // DDA (Dynamic Difficulty Adjustment)
        // BUG-A1 FIX: use `streak` (the actual field) not `currentStreak` (never existed)
        let opponentBoost = 1.0;
        if (isManagerMatch) {
            const streak = engine.managerStats?.streak || 0;
            const difficulty = getDifficulty();
            const rawBoost = calcOpponentBoost(streak);
            if (streak > 0) {
                opponentBoost = rawBoost;
            } else if (streak < 0) {
                const ddaLossMult = difficulty.modifiers.ddaLossMult ?? 1.0;
                const discount = 1.0 - rawBoost;
                opponentBoost = 1.0 - (discount * ddaLossMult);
            }
        }

        // Rookie Handicap
        if (isManagerMatch) {
            const rookieMult = getRookieHandicapFromEngine(engine);
            opponentBoost *= rookieMult;
        }

        // Match Strength Penalty (Difficulty)
        const matchPenalty = getDifficulty().modifiers.matchStrengthPenalty || 1.0;
        if (matchPenalty < 1.0) {
            if (isManagerHome) {
                homeSectors.attack = Math.floor(homeSectors.attack * matchPenalty);
                homeSectors.defense = Math.floor(homeSectors.defense * matchPenalty);
            } else if (isManagerAway) {
                awaySectors.attack = Math.floor(awaySectors.attack * matchPenalty);
                awaySectors.defense = Math.floor(awaySectors.defense * matchPenalty);
            }
        }

        // Win Streak Bonus
        const winStreakMult = getDifficulty().modifiers.winStreakMult ?? 1.0;
        if (isManagerHome) {
            const bonus = getWinStreakBonus(engine.manager?.teamId || 0);
            if (bonus.attrBonus > 0) {
                const scaled = Math.floor(bonus.attrBonus * winStreakMult);
                homeSectors.attack = Math.floor(homeSectors.attack + scaled);
                homeSectors.defense = Math.floor(homeSectors.defense + scaled);
            }
        } else if (isManagerAway) {
            const bonus = getWinStreakBonus(engine.manager?.teamId || 0);
            if (bonus.attrBonus > 0) {
                const scaled = Math.floor(bonus.attrBonus * winStreakMult);
                awaySectors.attack = Math.floor(awaySectors.attack + scaled);
                awaySectors.defense = Math.floor(awaySectors.defense + scaled);
            }
        }

        // BUG-A3 FIX: DDA boost is applied ONLY in MatchSimulator (xG level).
        // Removed from here to prevent double-application (sectors + xG = squared effect).
        // opponentBoost is still returned in context for the simulator to use.

        // Bicho (Match Bonus)
        const bichoBuff = getMatchBonusBuff(engine);
        if (bichoBuff > 1.0) {
            if (isManagerHome) {
                homeSectors.attack = Math.floor(homeSectors.attack * bichoBuff);
                homeSectors.defense = Math.floor(homeSectors.defense * bichoBuff);
            } else if (isManagerAway) {
                awaySectors.attack = Math.floor(awaySectors.attack * bichoBuff);
                awaySectors.defense = Math.floor(awaySectors.defense * bichoBuff);
            }
        }

        // Ticket Pricing Home Advantage
        const ticketHomeMod = getHomeAdvantageFromTickets(engine);
        if (isManagerHome && ticketHomeMod !== 1.0) {
            homeSectors.attack = Math.floor(homeSectors.attack * ticketHomeMod);
            homeSectors.defense = Math.floor(homeSectors.defense * ticketHomeMod);
        }

        // Climate System — BUG-B2 FIX: use read-only access with deterministic fallback.
        // ClimateZone is assigned in GameInitializer; if missing, use stable hash, not mutation.
        const zones = ['TROPICAL', 'COLD', 'ALTITUDE', 'RAINY'];
        const homeClimate = homeTeam.climateZone || zones[(homeId || 0) % zones.length];
        const awayClimate = awayTeam.climateZone || zones[(awayId || 0) % zones.length];

        let matchWeather = 'NORMAL';
        const weatherRoll = systemRng();
        if (homeClimate === 'TROPICAL') matchWeather = weatherRoll > 0.3 ? 'HOT' : 'RAIN';
        if (homeClimate === 'COLD') matchWeather = weatherRoll > 0.3 ? 'COLD' : 'RAIN';
        if (homeClimate === 'ALTITUDE') matchWeather = 'ALTITUDE';
        if (homeClimate === 'RAINY') matchWeather = weatherRoll > 0.3 ? 'HEAVY_RAIN' : 'NORMAL';

        let homeClimateMod = 1.0;
        let awayClimateMod = 1.0;
        let weatherDrainMod = 1.0;
        let weatherEventText = null;

        if (matchWeather === 'HOT') {
            if (awayClimate === 'COLD') awayClimateMod = CLIMATE_AWAY_PENALTY;
            if (homeClimate === 'TROPICAL') homeClimateMod = CLIMATE_HOME_BONUS;
            weatherDrainMod = WEATHER_DRAIN.HOT;
            weatherEventText = '☀️ Calor Intenso! (Desgaste alto no 2º tempo)';
        } else if (matchWeather === 'COLD') {
            if (awayClimate === 'TROPICAL') awayClimateMod = CLIMATE_AWAY_PENALTY;
            weatherDrainMod = WEATHER_DRAIN.COLD;
            weatherEventText = '❄️ Frio Congelante!';
        } else if (matchWeather === 'ALTITUDE') {
            if (awayClimate !== 'ALTITUDE') awayClimateMod = CLIMATE_ALTITUDE_PENALTY;
            weatherDrainMod = WEATHER_DRAIN.ALTITUDE;
            weatherEventText = '🏔️ Jogo na Altitude! (Ar rarefeito pune os visitantes)';
        } else if (matchWeather === 'HEAVY_RAIN' || matchWeather === 'RAIN') {
            if (homeTactic === 'posse') homeClimateMod -= RAIN_POSSE_PENALTY;
            if (homeTactic === 'counter') homeClimateMod += RAIN_COUNTER_BONUS;
            if (awayTactic === 'posse') awayClimateMod -= RAIN_POSSE_PENALTY;
            if (awayTactic === 'counter') awayClimateMod += RAIN_COUNTER_BONUS;
            weatherDrainMod = WEATHER_DRAIN.RAIN;
            weatherEventText = matchWeather === 'HEAVY_RAIN' ? '⛈️ Temporal! (Campo pesado, táticas de posse sofrem)' : '🌧️ Chuva Fina!';
        }

        return {
            homeSectors,
            awaySectors,
            context: {
                homeTactic,
                awayTactic,
                tactic,
                oppTactic,
                homeCounterMod,
                awayCounterMod,
                opponentBoost,
                homeClimateMod,
                awayClimateMod,
                weatherDrainMod,
                weatherEventText,
                isManagerMatch,
                predictabilityText,
                // Side effects — caller must apply these mutations
                sideEffects: {
                    newTacticStreak,
                    newLastTactic,
                }
            }
        };
    }
}
