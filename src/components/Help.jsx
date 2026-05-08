import React from 'react';
import { Tooltip } from './Tooltip';
import { getTooltip } from '../data/tooltipsLoader';

/**
 * Help — Tooltip wrapper that pulls content from tooltips.json by ID
 *
 * Usage:
 *   <Help id="stat.ovr"><span>OVR 78</span></Help>
 *   <Help id="btn.train" position="bottom"><button>Treinar</button></Help>
 *
 * If `id` not found in tooltips.json, falls back to the optional `fallback` prop.
 * If still no content, renders children unwrapped.
 */
export function Help({ id, fallback, position = 'auto', delay = 300, children, className = '' }) {
    const content = getTooltip(id) || fallback;
    if (!content) return children;
    return (
        <Tooltip content={content} position={position} delay={delay} className={className}>
            {children}
        </Tooltip>
    );
}

export default Help;
