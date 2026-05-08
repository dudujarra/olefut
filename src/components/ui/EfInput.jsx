/**
 * EfInput — Stitch component
 *
 * Beveled inverso (sunk), focus ring info, error state.
 */

import React from 'react';

export function EfInput({
    type = 'text',
    value,
    onChange,
    placeholder,
    icon,
    error,
    label,
    helper,
    id,
    disabled = false,
    size = 'md',
    'aria-label': ariaLabel,
    ...rest
}) {
    const SIZE_MAP = {
        sm: { padding: '4px 8px', fontSize: '12px' },
        md: { padding: '8px 12px', fontSize: '14px' },
        lg: { padding: '12px 16px', fontSize: '16px' }
    };
    const sizing = SIZE_MAP[size] || SIZE_MAP.md;
    const inputId = id || `ef-input-${Math.random().toString(36).slice(2, 8)}`;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ef-space-1)' }}>
            {label && (
                <label htmlFor={inputId} style={{
                    fontSize: 'var(--ef-font-size-caption)',
                    fontFamily: 'var(--ef-font-family-body)',
                    fontWeight: 600,
                    color: 'var(--ef-text-md)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                }}>
                    {label}
                </label>
            )}

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                {icon && (
                    <span style={{
                        position: 'absolute',
                        left: '8px',
                        color: 'var(--ef-text-md)',
                        pointerEvents: 'none'
                    }}>
                        {icon}
                    </span>
                )}
                <input
                    id={inputId}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    aria-label={ariaLabel}
                    aria-invalid={!!error || undefined}
                    aria-describedby={helper ? `${inputId}-helper` : undefined}
                    style={{
                        flex: 1,
                        padding: sizing.padding,
                        paddingLeft: icon ? '32px' : sizing.padding.split(' ')[1],
                        fontSize: sizing.fontSize,
                        fontFamily: 'var(--ef-font-family-body)',
                        color: 'var(--ef-text-hi)',
                        background: 'var(--ef-bg-card)',
                        border: '2px solid',
                        borderColor: error
                            ? 'var(--ef-color-func-danger)'
                            : 'var(--ef-bevel-dark) var(--ef-bevel-light) var(--ef-bevel-light) var(--ef-bevel-dark)',
                        boxShadow: 'var(--ef-shadow-inner-sunk)',
                        outline: 'none',
                        transition: 'border-color var(--ef-dur-fast)',
                        opacity: disabled ? 0.5 : 1,
                        cursor: disabled ? 'not-allowed' : 'text'
                    }}
                    onFocus={(e) => {
                        if (!error) {
                            e.target.style.borderColor = 'var(--ef-color-func-info)';
                        }
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = error
                            ? 'var(--ef-color-func-danger)'
                            : 'var(--ef-bevel-dark) var(--ef-bevel-light) var(--ef-bevel-light) var(--ef-bevel-dark)';
                    }}
                    {...rest}
                />
            </div>

            {error && (
                <span style={{
                    fontSize: 'var(--ef-font-size-caption)',
                    color: 'var(--ef-color-func-danger)',
                    fontFamily: 'var(--ef-font-family-body)'
                }}>
                    ⚠ {error}
                </span>
            )}

            {helper && !error && (
                <span id={`${inputId}-helper`} style={{
                    fontSize: 'var(--ef-font-size-caption)',
                    color: 'var(--ef-text-md)',
                    fontFamily: 'var(--ef-font-family-body)'
                }}>
                    {helper}
                </span>
            )}
        </div>
    );
}

export default EfInput;
