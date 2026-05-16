/**
 * Morphocycle.js
 * 
 * Deep Tactical Engine - Training & Physiology Module.
 * Based on Tactical Periodization (Frade) and sports science load metrics (sRPE, ACWR).
 * 
 * CORE METRICS:
 * - sRPE (Session Rating of Perceived Exertion) = RPE (0-10) * Duration (min)
 * - Weekly Load = Sum of sRPE over 7 days
 * - Monotony = Mean Weekly Load / Standard Deviation of Weekly Load
 * - Strain = Weekly Load * Monotony
 * - ACWR (Acute:Chronic Workload Ratio) = Acute Load (1 week) / Chronic Load (4 weeks avg)
 *   > "Sweet spot" for ACWR is 0.8 - 1.3. > 1.5 increases injury risk significantly.
 */

class Morphocycle {
    constructor() {
        // Standard Morphocycle definitions
        this.DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        // RPE (0-10 scale): 
        // 0=Rest, 2=Easy, 3=Moderate, 5=Hard, 7=Very Hard, 10=Maximal
        this.SESSION_TYPES = {
            RECOVERY: { rpe: 2, duration: 45, type: 'Tactical', load: 90 }, // MD+1
            TENSION: { rpe: 8, duration: 60, type: 'Physical/Small-Sided', load: 480 }, // MD-4 (Strength/Accel)
            DURATION: { rpe: 7, duration: 90, type: 'Physical/Large-Sided', load: 630 }, // MD-3 (Endurance/Stamina)
            SPEED: { rpe: 6, duration: 60, type: 'Speed/Reactivity', load: 360 }, // MD-2 (Speed/Finishing)
            ACTIVATION: { rpe: 3, duration: 45, type: 'Tactical/Strategy', load: 135 }, // MD-1
            MATCH: { rpe: 10, duration: 90, type: 'Match', load: 900 }, // Match Day
            REST: { rpe: 0, duration: 0, type: 'Rest', load: 0 }
        };
    }

    /**
     * Calculates the Daily Load for a specific player based on the session and their physical state.
     * @param {Object} player - The player object (with 38-attributes schema).
     * @param {string} sessionKey - Key from SESSION_TYPES.
     * @param {number} minutesPlayed - If it's a match, how many minutes the player played.
     * @returns {Object} - Result containing the calculated load and impact on attributes.
     */
    calculateDailyLoad(player, sessionKey, minutesPlayed = null) {
        const session = this.SESSION_TYPES[sessionKey];
        if (!session) return { load: 0, fatigueIncrease: 0, formImpact: 0 };

        let actualDuration = session.duration;
        let actualRpe = session.rpe;

        if (sessionKey === 'MATCH') {
            actualDuration = minutesPlayed !== null ? minutesPlayed : 0;
            // Unused subs or minimal minutes get lower RPE
            actualRpe = actualDuration > 60 ? 10 : (actualDuration > 30 ? 7 : 4);
        }

        let baseLoad = actualRpe * actualDuration; // sRPE

        // Player attributes modifier (Natural Fitness mitigates perceived exertion slightly)
        // Natural Fitness is 1-100. 
        const naturalFitness = player.attributes?.physical?.naturalFitness || 50;
        
        // High natural fitness reduces the 'strain' perceived by the body by up to 15%
        const fitnessModifier = 1 - ((naturalFitness - 50) / 50) * 0.15;
        let actualLoad = Math.round(baseLoad * fitnessModifier);

        // Fatigue and Form calculations
        let fatigueIncrease = (actualLoad / 100); 
        let formImpact = 0;

        // Over-training penalty
        if (sessionKey === 'TENSION' || sessionKey === 'DURATION') {
            // Good for form, but taxing
            formImpact = +0.2;
        }

        return {
            load: actualLoad,
            fatigueIncrease,
            formImpact,
            type: session.type
        };
    }

    /**
     * Calculates weekly monotony and strain based on an array of daily loads.
     * @param {number[]} dailyLoads - Array of exactly 7 daily loads.
     * @returns {Object} - Weekly load stats.
     */
    calculateWeeklyStrain(dailyLoads) {
        if (dailyLoads.length !== 7) {
            throw new Error('dailyLoads array must contain exactly 7 days of data.');
        }

        const weeklyLoad = dailyLoads.reduce((sum, load) => sum + load, 0);
        const meanLoad = weeklyLoad / 7;

        // Calculate Standard Deviation
        const variance = dailyLoads.reduce((sum, load) => sum + Math.pow(load - meanLoad, 2), 0) / 7;
        const stdDev = Math.sqrt(variance);

        // Monotony: High monotony (training the same way every day) increases injury risk
        // If stdDev is 0 (all days identical), monotony spikes. 
        const monotony = stdDev > 0 ? (meanLoad / stdDev) : (meanLoad > 0 ? 5 : 0);

        // Strain
        const strain = weeklyLoad * monotony;

        return {
            weeklyLoad: Math.round(weeklyLoad),
            monotony: parseFloat(monotony.toFixed(2)),
            strain: Math.round(strain)
        };
    }

    /**
     * Calculate Acute:Chronic Workload Ratio (ACWR)
     * @param {number} acuteLoad - Load from the current week.
     * @param {number[]} chronicLoads - Array of loads from the past 4 weeks (or less if new).
     * @returns {Object} - ACWR data and injury risk assessment.
     */
    calculateACWR(acuteLoad, chronicLoads) {
        if (!chronicLoads || chronicLoads.length === 0) {
            // First week, can't calculate a true chronic load, default to 1.0
            return { acwr: 1.0, risk: 'Normal', message: 'Not enough data' };
        }

        const avgChronic = chronicLoads.reduce((a, b) => a + b, 0) / chronicLoads.length;
        if (avgChronic === 0) {
            return { acwr: 1.0, risk: 'Normal', message: 'Chronic load is zero' };
        }

        const acwr = parseFloat((acuteLoad / avgChronic).toFixed(2));
        
        let risk = 'Normal';
        let message = 'Sweet Spot';

        if (acwr < 0.8) {
            risk = 'Low';
            message = 'Under-training. Increased risk of loss of fitness.';
        } else if (acwr > 1.5) {
            risk = 'Danger Zone';
            message = 'High injury risk. Load spike detected.';
        } else if (acwr >= 1.3) {
            risk = 'Caution';
            message = 'Approaching danger zone. Monitor closely.';
        }

        return {
            acwr,
            risk,
            message
        };
    }

    /**
     * Applies the Morphocycle training logic to a player, calculating their growth in specific 38-attributes.
     * @param {Object} player - The player object.
     * @param {string} sessionKey - The type of training session.
     * @returns {Object} - Attribute deltas representing growth.
     */
    applyTrainingGrowth(player, sessionKey) {
        const deltas = { technical: {}, mental: {}, physical: {}, goalkeeping: {} };
        const age = player.age || 25;
        
        // Younger players grow faster. 
        const ageModifier = age < 23 ? 1.5 : (age > 30 ? 0.5 : 1.0);
        const baseGrowth = 0.05 * ageModifier;

        if (sessionKey === 'TENSION') {
            // Small sided games (Spaces < 40m). High Accel, Agility, Tackling, Dribbling
            if (player.position !== 'GK') {
                deltas.physical.acceleration = baseGrowth * 2;
                deltas.physical.agility = baseGrowth * 2;
                deltas.technical.dribbling = baseGrowth;
                deltas.technical.tackling = baseGrowth;
                deltas.mental.aggression = baseGrowth;
            } else {
                deltas.goalkeeping.reflexes = baseGrowth * 2;
                deltas.physical.agility = baseGrowth * 2;
            }
        } else if (sessionKey === 'DURATION') {
            // Large sided games (Spaces > 60m). High Stamina, Positioning, Vision
            if (player.position !== 'GK') {
                deltas.physical.stamina = baseGrowth * 2.5;
                deltas.mental.positioning = baseGrowth * 2;
                deltas.mental.vision = baseGrowth * 1.5;
                deltas.technical.passing = baseGrowth;
            } else {
                deltas.goalkeeping.positioning = baseGrowth * 2;
                deltas.physical.stamina = baseGrowth;
            }
        } else if (sessionKey === 'SPEED') {
            // Speed without opposition. Sprint Speed, Finishing
            if (player.position !== 'GK') {
                deltas.physical.sprintSpeed = baseGrowth * 2;
                deltas.technical.finishing = baseGrowth * 2;
                deltas.mental.composure = baseGrowth;
            } else {
                deltas.goalkeeping.handling = baseGrowth * 2;
                deltas.physical.sprintSpeed = baseGrowth;
            }
        } else if (sessionKey === 'ACTIVATION' || sessionKey === 'RECOVERY') {
            // Tactical/Strategy. Tactical Knowledge, Anticipation
            deltas.mental.anticipation = baseGrowth * 1.5;
            deltas.mental.decisions = baseGrowth * 1.5;
            if (player.position === 'GK') {
                deltas.goalkeeping.communication = baseGrowth * 2;
            }
        }

        return deltas;
    }
}

export default new Morphocycle();
