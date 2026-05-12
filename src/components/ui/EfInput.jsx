/**
 * EfInput — Stitch component
 *
 * Beveled inverso (sunk), focus ring info, error state.
 * 16-bit Brutalist Arcade edition.
 */

import { rng as systemRng } from '../../engine/rng.js';

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
    const inputId = id || `ef-input-${systemRng().toString(36).slice(2, 8)}`;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {label && (
                <label htmlFor={inputId} style={{
                    fontSize: '0.5rem',
                    fontFamily: "'Press Start 2P', monospace",
                    fontWeight: 600,
                    color: '#888',
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
                        color: '#888',
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
                        fontFamily: 'monospace',
                        color: '#E2E8F0',
                        background: '#111417',
                        border: '4px solid',
                        borderColor: error
                            ? '#FF3333'
                            : '#111417 #4A5059 #4A5059 #111417',
                        boxShadow: 'inset 2px 2px 0 #040805',
                        outline: 'none',
                        transition: 'border-color 0.1s',
                        opacity: disabled ? 0.5 : 1,
                        cursor: disabled ? 'not-allowed' : 'text'
                    }}
                    onFocus={(e) => {
                        if (!error) {
                            e.target.style.borderColor = '#40BAF7';
                        }
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = error
                            ? '#FF3333'
                            : '#111417 #4A5059 #4A5059 #111417';
                    }}
                    {...rest}
                />
            </div>

            {error && (
                <span style={{
                    fontSize: '0.45rem',
                    color: '#FF3333',
                    fontFamily: "'Press Start 2P', monospace"
                }}>
                    ⚠ {error}
                </span>
            )}

            {helper && !error && (
                <span id={`${inputId}-helper`} style={{
                    fontSize: '0.45rem',
                    color: '#888',
                    fontFamily: "'Press Start 2P', monospace"
                }}>
                    {helper}
                </span>
            )}
        </div>
    );
}

export default EfInput;
