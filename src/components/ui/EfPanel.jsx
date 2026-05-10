/**
 * EfPanel — Stitch beveled container.
 *
 * Substitui inline style `card`/`glass-panel` legacy.
 * Variants: default | elev | hero | warning | danger
 */

import React from 'react';

const VARIANT_BG = {
    default: 'var(--ef-bg-card)',
    elev: 'var(--ef-bg-elev)',
    hero: 'var(--ef-color-grass-700)',
    warning: 'var(--ef-color-func-warning)',
    danger: 'var(--ef-color-func-danger)'
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

    return (
        <div
            onClick={onClick}
            className={`ef-panel ef-panel-${variant} ${className}`}
            style={{
                background: VARIANT_BG[variant] || VARIANT_BG.default,
                border: '2px solid',
                borderColor: 'var(--ef-bevel-light) var(--ef-bevel-dark) var(--ef-bevel-dark) var(--ef-bevel-light)',
                boxShadow: 'var(--ef-shadow-drop)',
                cursor: onClick ? 'pointer' : 'default',
                color: variant === 'warning' ? 'var(--ef-color-neutral-bg)' : 'var(--ef-text-hi)',
                ...style
            }}
        >
            {title && (
                <div style={{
                    padding: '8px 12px',
                    background: headerColor || (variant === 'hero' ? '#0B2015' : 'var(--ef-color-grass-700)'),
                    borderBottom: '2px solid var(--ef-bevel-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontFamily: 'var(--ef-font-family-display)',
                    fontSize: 'var(--ef-font-size-caption)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--ef-text-hi)'
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
