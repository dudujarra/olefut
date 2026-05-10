import { useState, useEffect, useRef } from 'react';

/**
 * §16.3: Number count-up animation hook.
 * Animates a number from 0 (or previous value) to target value.
 * Uses requestAnimationFrame for smooth 60fps rendering.
 *
 * @param {number} target — final value to animate to
 * @param {object} opts — { duration: ms, decimals: 0, prefix: '', suffix: '' }
 * @returns {string} formatted animated value
 */
export function useCountUp(target, opts = {}) {
    const { duration = 800, decimals = 0, prefix = '', suffix = '' } = opts;
    const [display, setDisplay] = useState(target);
    const prevRef = useRef(target);
    const frameRef = useRef(null);

    useEffect(() => {
        const from = prevRef.current;
        const to = target;
        prevRef.current = target;

        if (from === to) {
            setDisplay(to);
            return;
        }

        const startTime = performance.now();
        const diff = to - from;

        function step(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic for satisfying deceleration
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = from + diff * eased;

            setDisplay(current);

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(step);
            }
        }

        frameRef.current = requestAnimationFrame(step);

        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, [target, duration]);

    const formatted = decimals > 0
        ? display.toFixed(decimals)
        : Math.round(display).toLocaleString('pt-BR');

    return `${prefix}${formatted}${suffix}`;
}

/**
 * §16.3: Animated stat display component.
 * Use in place of raw numbers for player stats, financial values, standings.
 */
export function AnimatedStat({ value, prefix = '', suffix = '', duration = 600, decimals = 0, className = '' }) {
    const animated = useCountUp(value, { duration, decimals, prefix, suffix });
    return <span className={`animated-stat ${className}`}>{animated}</span>;
}
