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

import { memo } from 'react';
import { HIGH_END_SHIELDS } from '../../assets/shields/high_end';

const SIZE_PX = {
    sm: 24,
    md: 48,
    lg: 96,
    xl: 128,
    xxl: 180
};

// SPEC-169 (Bloco 3.3): memoizado — aparece em listas de standings, market,
// dashboard; props (name+size) raramente mudam por linha.
function EfClubBadgeImpl({
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
                <div style={{ width: px, height: px, backgroundColor: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--color-shadow-deep)' }}>
                    <span style={{ color: 'var(--color-soft-text)', fontSize: px/3, fontFamily: 'var(--font-display)' }}>?</span>
                </div>
            )}
            {showName && (
                <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: size === 'sm' ? '7px' : size === 'md' ? '8px' : '10px',
                    color: 'var(--color-soft-text)',
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

export const EfClubBadge = memo(EfClubBadgeImpl);
EfClubBadge.displayName = 'EfClubBadge';

export default EfClubBadge;
