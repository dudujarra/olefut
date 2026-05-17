/**
 * EfButton — SNES 16-bit Brutalist Arcade
 *
 * Variants: primary | secondary | danger | ghost
 * Sizes: sm | md | lg
 *
 * Heavy 4px bevel borders, pixel-perfect press feedback,
 * Press Start 2P for labels, zero border-radius.
 *
 * SPEC-169 (Bloco 3.3): wrapped em React.memo. EfButton aparece em listas
 * grandes (mercado, elenco, standings) — sem memo, todo render do parent
 * propagava cascata. Memoize evita re-render quando props referenciais
 * forem estáveis (handlers via useCallback no consumer).
 */

import { memo } from 'react';

function EfButtonImpl({
    variant = 'primary',
    size = 'md',
    icon,
    loading = false,
    disabled = false,
    children,
    onClick,
    type = 'button',
    title,
    className = '',
    'aria-label': ariaLabel,
    ...rest
}) {
    const { 
        name, id, style, onFocus, onBlur, onMouseEnter, onMouseLeave, tabIndex, role 
    } = rest;
    
    const isDisabled = disabled || loading;

    return (
        <button
            id={id}
            name={name}
            type={type}
            onClick={isDisabled ? undefined : onClick}
            onFocus={onFocus}
            onBlur={onBlur}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            disabled={isDisabled}
            title={title}
            tabIndex={tabIndex}
            role={role}
            style={style}
            aria-label={ariaLabel}
            aria-busy={loading || undefined}
            className={`ef-btn ef-btn-${variant} ef-btn-${size} ${className}`.trim()}
        >
            {loading && <span className="ef-anim-spinner-sm" aria-label="Carregando" />}
            {!loading && icon && <span className="ef-btn-icon">{icon}</span>}
            {children}
        </button>
    );
}

export const EfButton = memo(EfButtonImpl);
EfButton.displayName = 'EfButton';

export default EfButton;
