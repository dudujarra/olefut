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

    // Note: To remain backwards-compatible, we extract standard input props
    // that might be passed in `rest` but we avoid a blind spread `{...rest}`
    // which can leak React objects to DOM. For now, we only pass explicit props 
    // or standard HTML input props.
    const { name, min, max, step, required, maxLength, readOnly, autoFocus } = rest;

    return (
        <div className="ef-input-wrapper flex flex-col gap-1">
            {label && (
                <label 
                    htmlFor={inputId} 
                    className="ef-input-label font-display text-color-muted uppercase tracking-[0.04em] font-semibold"
                    style={{ fontSize: '0.5rem' }}
                >
                    {label}
                </label>
            )}

            <div className="relative flex items-center">
                {icon && (
                    <span className="absolute left-2 text-color-muted pointer-events-none">
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
                    className={`ef-input flex-1 font-mono text-color-soft-text bg-bg-dark border-4 outline-none transition-colors duration-100 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'} ${error ? 'border-danger' : 'border-bg-dark border-b-border-panel border-r-border-panel focus:border-info'} shadow-[inset_2px_2px_0_var(--color-shadow-deep)]`}
                    style={{
                        padding: sizing.padding,
                        paddingLeft: icon ? '32px' : sizing.padding.split(' ')[1],
                        fontSize: sizing.fontSize
                    }}
                    name={name}
                    min={min}
                    max={max}
                    step={step}
                    required={required}
                    maxLength={maxLength}
                    readOnly={readOnly}
                    autoFocus={autoFocus}
                />
            </div>

            {error && (
                <span className="ef-input-error text-danger font-display text-[0.45rem]">
                    {error}
                </span>
            )}

            {helper && !error && (
                <span id={`${inputId}-helper`} className="ef-input-helper text-color-muted font-display text-[0.45rem]">
                    {helper}
                </span>
            )}
        </div>
    );
}

export default EfInput;
