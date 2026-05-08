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
import { getClubColors, getClubSprite, SPRITE_SHEETS } from '../../data/clubColors';

const SIZE_PX = {
    sm: 24,
    md: 48,
    lg: 96,
    xl: 128
};

export function EfClubBadge({
    name,
    size = 'md',
    style = {},
    showName = false,
    onClick = null
}) {
    const colors = getClubColors(name);
    const sprite = getClubSprite(name);
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

    return (
        <div style={wrapperStyle} {...badgeProps}>
            {sprite ? (
                <SpriteBadge sprite={sprite} px={px} />
            ) : (
                <FallbackBadge colors={colors} px={px} />
            )}
            {showName && (
                <span style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: size === 'sm' ? '7px' : size === 'md' ? '8px' : '10px',
                    color: 'var(--ef-text-hi, #F4F1DE)',
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

/**
 * Sprite-based badge — crops single cell from spritesheet.
 * Cell width = 1/cols of full sheet.
 * Cell height = 1/rows of full sheet.
 */
function SpriteBadge({ sprite, px }) {
    const sheetCfg = SPRITE_SHEETS[sprite.sheet];
    if (!sheetCfg) return null;
    const { url, cols, rows } = sheetCfg;

    return (
        <div
            style={{
                width: px,
                height: px,
                backgroundImage: `url('${url}')`,
                backgroundSize: `${px * cols}px ${px * rows}px`,
                backgroundPosition: `-${sprite.col * px}px -${sprite.row * px}px`,
                backgroundRepeat: 'no-repeat',
                imageRendering: 'pixelated',
                WebkitImageRendering: 'pixelated'
            }}
        />
    );
}

/**
 * Fallback badge — SVG abstract for unmapped clubs.
 * Pure pixel-art (rect-only, no curves, crispEdges).
 */
function FallbackBadge({ colors, px }) {
    return (
        <svg
            width={px}
            height={px}
            viewBox="0 0 16 16"
            shapeRendering="crispEdges"
            style={{ imageRendering: 'pixelated' }}
        >
            {/* Bevel light frame */}
            <rect x="0" y="0" width="16" height="16" fill="var(--ef-bevel-light, #5C8A6A)" />
            {/* Inner inset 1px */}
            <rect x="1" y="1" width="14" height="14" fill={colors.primary} />
            {/* Accent stripe row 7-8 */}
            <rect x="1" y="7" width="14" height="2" fill={colors.accent} />
            {/* Bottom secondary 1/3 */}
            <rect x="1" y="9" width="14" height="6" fill={colors.secondary} />
            {/* Bevel dark frame */}
            <path
                d="M15,1 L16,1 L16,16 L1,16 L1,15 L15,15 Z"
                fill="var(--ef-bevel-dark, #0A130E)"
            />
            {/* Initials text */}
            <text
                x="8"
                y="11"
                textAnchor="middle"
                fontSize="5"
                fontFamily="'Press Start 2P', monospace"
                fill={colors.secondary}
                stroke={colors.primary}
                strokeWidth="0.3"
                paintOrder="stroke fill"
            >
                {colors.initials}
            </text>
        </svg>
    );
}

export default EfClubBadge;
