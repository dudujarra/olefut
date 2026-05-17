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

    const img = HIGH_END_SHIELDS[name];

    const containerStyle = style && Object.keys(style).length > 0 ? { ...style, '--badge-size': px + 'px' } : { '--badge-size': px + 'px' };
    
    return (
        <div 
            className="ef-club-badge flex flex-col items-center gap-1" 
            style={containerStyle}
            role={onClick ? 'button' : 'img'}
            aria-label={`Escudo ${name}`}
            onClick={onClick}
        >
            {img ? (
                <img 
                    src={img} 
                    alt={name} 
                    className="ef-club-badge-img ef-pixel-render" 
                    width={px}
                    height={px}
                />
            ) : (
                <div 
                    className="ef-club-badge-placeholder flex items-center justify-center bg-bg-dark border-[3px] border-color-shadow-deep"
                >
                    <span 
                        className="ef-club-badge-placeholder-text font-display text-color-soft-text"
                    >
                        ?
                    </span>
                </div>
            )}
            {showName && (
                <span 
                    className={`ef-club-badge-name ef-club-badge-name-${size} font-display text-color-soft-text uppercase tracking-[0.04em] text-center overflow-hidden whitespace-nowrap text-ellipsis`}
                >
                    {name}
                </span>
            )}
        </div>
    );
}

export const EfClubBadge = memo(EfClubBadgeImpl);
EfClubBadge.displayName = 'EfClubBadge';

export default EfClubBadge;
