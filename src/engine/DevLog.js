/**
 * DevLog — Development-only logging utility.
 * 
 * Wraps console.log/warn/error with environment check.
 * In production builds (import.meta.env.PROD), all logs are silenced.
 * In development, logs with structured prefix for easy grep.
 * 
 * Usage:
 *   import { devLog, devWarn } from '../engine/DevLog.js';
 *   devLog('DAgger', `Warm-start: ${n} lessons`);  // → [DAgger] Warm-start: 5 lessons
 *   devWarn('WebLLM', 'GPU not available');          // → [WebLLM] GPU not available
 */

const IS_DEV = typeof import.meta !== 'undefined' 
    ? !import.meta.env?.PROD 
    : typeof process !== 'undefined' 
        ? process.env?.NODE_ENV !== 'production'
        : true;

/**
 * Log only in development. Silenced in production builds.
 * @param {string} tag - Module/subsystem tag (e.g., 'DAgger', 'PWA', 'Audio')
 * @param  {...any} args - Arguments to log
 */
export function devLog(tag, ...args) {
    if (IS_DEV) console.log(`[${tag}]`, ...args);
}

/**
 * Warn only in development.
 * @param {string} tag
 * @param  {...any} args
 */
export function devWarn(tag, ...args) {
    if (IS_DEV) console.warn(`[${tag}]`, ...args);
}

/**
 * Error always logs (even in production — errors should never be silent).
 * @param {string} tag
 * @param  {...any} args
 */
export function devError(tag, ...args) {
    console.error(`[${tag}]`, ...args);
}
