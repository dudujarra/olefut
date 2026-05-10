/**
 * EfPanel — SNES 16-bit Brutalist Arcade Container
 *
 * Heavy metal beveled container with zero transparency.
 * Variants: default | elev | sunk | hero | warning | danger
 */

import React from 'react';

const VARIANT_STYLES = {
    default: { bg: '#1E2124', border: '#4A5059 #111417 #111417 #4A5059' },
    elev:    { bg: '#1E2124', border: '#4A5059 #111417 #111417 #4A5059' },
    sunk:    { bg: '#111417', border: '#111417 #4A5059 #4A5059 #111417' },
    hero:    { bg: '#0B2015', border: '#39FF14 #1A8A0A #1A8A0A #39FF14' },
    warning: { bg: '#1A1A0A', border: '#FFD700 #AA8800 #AA8800 #FFD700' },
    danger:  { bg: '#1A0A0A', border: '#FF3333 #AA1111 #AA1111 #FF3333' }
};

export function EfPanel({
    variant = 'default',
    title,
    icon,
    headerColor,
    padding = 'md',
    children,
    onClick,
    className = '',
    style = {}
}) {
    const PADDING = { sm: '8px', md: '16px', lg: '24px' };
    const v = VARIANT_STYLES[variant] || VARIANT_STYLES.default;

    return (
        <div
            onClick={onClick}
            className={`ef-panel ef-panel-${variant} ${className}`}
            style={{
                background: v.bg,
                border: '4px solid',
                borderColor: v.border,
                borderRadius: '0px',
                boxShadow: variant === 'sunk' ? 'inset 0 2px 4px rgba(0,0,0,0.5)' : '0 4px 0 rgba(0,0,0,0.5)',
                cursor: onClick ? 'pointer' : 'default',
                color: '#E2E8F0',
                imageRendering: 'pixelated',
                ...style
            }}
        >
            {title && (
                <div style={{
                    padding: '8px 12px',
                    background: headerColor || '#111417',
                    borderBottom: '2px solid #000',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '0.55rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#FFD700',
                    textShadow: '2px 2px 0 #000'
                }}>
                    {icon && <span>{icon}</span>}
                    {title}
                </div>
            )}
            <div style={{ padding: PADDING[padding] || PADDING.md }}>
                {children}
            </div>
        </div>
    );
}

export default EfPanel;
