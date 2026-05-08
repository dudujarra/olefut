/**
 * EfButton — Stitch component
 *
 * Variants: primary | secondary | danger | ghost
 * Sizes: sm | md | lg
 *
 * Hover offset -1px Y, active offset +2px Y, disabled opacity 0.5, loading spinner.
 */

import React from 'react';

const VARIANT_BG = {
    primary: 'var(--ef-color-func-success)',
    secondary: 'var(--ef-color-grass-500)',
    danger: 'var(--ef-color-func-danger)',
    ghost: 'transparent'
};

const VARIANT_BG_HOVER = {
    primary: 'var(--ef-color-grass-300)',
    secondary: 'var(--ef-color-grass-300)',
    danger: 'var(--ef-color-func-danger-dark)',
    ghost: 'var(--ef-color-neutral-bg-elev)'
};

const VARIANT_TEXT = {
    primary: 'var(--ef-color-neutral-bg)',
    secondary: 'var(--ef-color-neutral-text-hi)',
    danger: 'var(--ef-color-neutral-text-hi)',
    ghost: 'var(--ef-color-neutral-text-hi)'
};

const SIZE = {
    sm: { padding: '4px 8px', fontSize: '12px' },
    md: { padding: '8px 16px', fontSize: '14px' },
    lg: { padding: '12px 24px', fontSize: '16px' }
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
                fontFamily: 'var(--ef-font-family-body)',
                fontWeight: 600,
                background: VARIANT_BG[variant] || VARIANT_BG.primary,
                color: VARIANT_TEXT[variant] || VARIANT_TEXT.primary,
                border: '2px solid',
                borderColor: variant === 'ghost' ? 'var(--ef-bevel-light)' : 'var(--ef-bevel-light) var(--ef-bevel-dark) var(--ef-bevel-dark) var(--ef-bevel-light)',
                boxShadow: variant === 'ghost' ? 'none' : 'var(--ef-shadow-drop)',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1,
                transition: 'transform var(--ef-dur-fast) var(--ef-ease-step1), box-shadow var(--ef-dur-fast)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--ef-space-2)',
                userSelect: 'none',
                imageRendering: 'pixelated'
            }}
            onMouseEnter={(e) => {
                if (isDisabled) return;
                e.currentTarget.style.background = VARIANT_BG_HOVER[variant] || VARIANT_BG_HOVER.primary;
                e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = VARIANT_BG[variant] || VARIANT_BG.primary;
                e.currentTarget.style.transform = 'translateY(0)';
            }}
            onMouseDown={(e) => {
                if (isDisabled) return;
                e.currentTarget.style.transform = 'translateY(2px)';
                e.currentTarget.style.boxShadow = 'none';
            }}
            onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = 'var(--ef-shadow-drop)';
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
