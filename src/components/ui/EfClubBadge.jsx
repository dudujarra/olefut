/**
 * EfClubBadge v3 — pixel-art sprite-based club shield (SPEC-060).
 *
 * Usa spritesheets PNG geradas via Stitch (Gemini 3 Flash):
 *   /sprites/clubs/spritesheet-serie-{a,b,c,d}.png
 *   Cada sheet 5 cols × 4 rows = 20 badges
 *   80 clubes total Série A/B/C/D
 *
 * 100% pixel-art SNES direção arte:
 * - PNG nativo Stitch chunky pixels visible
 * - background-position crop per club
 * - image-rendering: pixelated (nearest-neighbor scale)
 * - Fallback SVG abstract para clubes não mapeados
 *
 * Sizes: sm 24, md 48, lg 96, xl 128 (8px grid)
 */

import React from 'react';
import { HIGH_END_SHIELDS } from '../../assets/shields/high_end';

const SIZE_PX = {
    sm: 24,
    md: 48,
    lg: 96,
    xl: 128,
    xxl: 180
};

export function EfClubBadge({
    name,
    size = 'md',
    style = {},
    showName = false,
    onClick = null
}) {
    const px = SIZE_PX[size] || SIZE_PX.md;

    const wrapperStyle = {
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        cursor: onClick ? 'pointer' : 'default',
        ...style
    };

    const badgeProps = {
        role: onClick ? 'button' : 'img',
        'aria-label': `Escudo ${name}`,
        onClick
    };

    const img = HIGH_END_SHIELDS[name];

    return (
        <div style={wrapperStyle} {...badgeProps}>
            {img ? (
                <img src={img} alt={name} style={{ width: px, height: px, imageRendering: 'pixelated', WebkitImageRendering: 'pixelated', objectFit: 'contain' }} />
            ) : (
                <div style={{ width: px, height: px, backgroundColor: '#111417', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #000' }}>
                    <span style={{ color: '#E2E8F0', fontSize: px/3, fontFamily: "'Press Start 2P', monospace" }}>?</span>
                </div>
            )}
            {showName && (
                <span style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: size === 'sm' ? '7px' : size === 'md' ? '8px' : '10px',
                    color: '#E2E8F0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    textAlign: 'center',
                    maxWidth: `${px * 1.5}px`,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {name}
                </span>
            )}
        </div>
    );
}

export default EfClubBadge;
