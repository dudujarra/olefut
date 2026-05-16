import { EngineLogger } from '../engine/EngineLogger.js';
/**
 * AutoPlayPersistence — State Management
 *
 * Handles saving, restoring, and resetting AutoPlay states in localStorage.
 * Includes functions to nuke the engine state and reset training data.
 */

import { SAVE_KEY } from '../engine/constants.js';
const STORAGE_KEY = 'olefut_autoplay_state';

export class AutoPlayPersistence {
    static restoreStats(statsObj) {
        try {
            if (typeof localStorage === 'undefined') return;
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (!saved || typeof saved !== 'object') return;
            
            // Merge saved counters + insights, preserve current empty arrays for fresh logs
            const preserveArrays = ['anomalies', 'successes', 'decisions'];
            for (const key of Object.keys(saved)) {
                if (preserveArrays.includes(key)) {
                    // Restore last 100 entries to avoid unbounded growth
                    if (Array.isArray(saved[key])) {
                        statsObj[key] = saved[key].slice(-100);
                    }
                } else if (key === 'insights' && saved.insights) {
                    statsObj.insights = { ...statsObj.insights, ...saved.insights };
                } else if (saved[key] !== undefined) {
                    statsObj[key] = saved[key];
                }
            }
            // Don't restore startTime/running — fresh session is paused initially
            statsObj.startTime = null;
        } catch (err) { EngineLogger.capture(err, 'AutoPlayPersistence.js', 'ignore'); }
    }

    static saveStats(statsObj) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(statsObj));
        } catch (err) { EngineLogger.capture(err, 'AutoPlayPersistence.js', 'ignore'); }
    }

    static resetStatsOnly() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('Failed to reset stats:', e);
            return false;
        }
    }

    static nukeEngineState() {
        try {
            localStorage.removeItem(SAVE_KEY);
            return true;
        } catch (e) {
            console.error('Failed to nuke engine:', e);
            return false;
        }
    }
}
