/**
 * EfButton — SNES 16-bit Brutalist Arcade
 *
 * Variants: primary | secondary | danger | ghost
 * Sizes: sm | md | lg
 *
 * Heavy 4px bevel borders, pixel-perfect press feedback,
 * Press Start 2P for labels, zero border-radius.
 */

import React from 'react';

const VARIANT_STYLES = {
    primary: {
        bg: '#0A1A0A',
        bgHover: '#0F2F0F',
        text: '#39FF14',
        border: '#39FF14 #1A8A0A #1A8A0A #39FF14',
        shadow: '0 3px 0 #0A4A0A'
    },
    secondary: {
        bg: '#1E2124',
        bgHover: '#2A2D32',
        text: '#E2E8F0',
        border: '#4A5059 #111417 #111417 #4A5059',
        shadow: '0 3px 0 rgba(0,0,0,0.5)'
    },
    danger: {
        bg: '#1A0A0A',
        bgHover: '#2A1010',
        text: '#FF3333',
        border: '#FF3333 #AA1111 #AA1111 #FF3333',
        shadow: '0 3px 0 #400000'
    },
    ghost: {
        bg: 'transparent',
        bgHover: '#1E2124',
        text: '#888',
        border: '#333 #111 #111 #333',
        shadow: 'none'
    }
};

const SIZE = {
    sm: { padding: '6px 10px', fontSize: '0.5rem' },
    md: { padding: '10px 18px', fontSize: '0.55rem' },
    lg: { padding: '14px 28px', fontSize: '0.7rem' }
};

export function EfButton({
    variant = 'primary',
    size = 'md',
    icon,
    loading = false,
    disabled = false,
    children,
    onClick,
    type = 'button',
    title,
    'aria-label': ariaLabel,
    ...rest
}) {
    const sizing = SIZE[size] || SIZE.md;
    const v = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
    const isDisabled = disabled || loading;

    return (
        <button
            type={type}
            onClick={isDisabled ? undefined : onClick}
            disabled={isDisabled}
            title={title}
            aria-label={ariaLabel}
            aria-busy={loading || undefined}
            className={`ef-btn ef-btn-${variant} ef-btn-${size}`}
            style={{
                padding: sizing.padding,
                fontSize: sizing.fontSize,
                fontFamily: "'Press Start 2P', monospace",
                fontWeight: 600,
                background: v.bg,
                color: v.text,
                border: '4px solid',
                borderColor: v.border,
                borderRadius: '0px',
                boxShadow: v.shadow,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1,
                transition: 'transform 50ms, box-shadow 50ms',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                userSelect: 'none',
                imageRendering: 'pixelated',
                textShadow: variant === 'ghost' ? 'none' : '1px 1px 0 #000',
                letterSpacing: '0.02em'
            }}
            onMouseEnter={(e) => {
                if (isDisabled) return;
                e.currentTarget.style.background = v.bgHover;
                e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = v.bg;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = v.shadow;
            }}
            onMouseDown={(e) => {
                if (isDisabled) return;
                e.currentTarget.style.transform = 'translateY(2px)';
                e.currentTarget.style.boxShadow = 'none';
            }}
            onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = v.shadow;
            }}
            {...rest}
        >
            {loading && <span className="ef-anim-spinner-sm" aria-label="Carregando" />}
            {!loading && icon && <span className="ef-btn-icon">{icon}</span>}
            {children}
        </button>
    );
}

export default EfButton;
