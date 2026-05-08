/**
 * EfStatLine — inline stat com label + value + optional bar.
 *
 * Used em painéis denso (Dashboard ISS-style).
 */

import React from 'react';

export function EfStatLine({
    label,
    value,
    suffix,
    color,
    barValue,
    barMax = 100,
    icon,
    bold = false
}) {
    let valColor = color || 'var(--ef-text-hi)';

    if (!color && typeof barValue === 'number') {
        const pct = (barValue / barMax) * 100;
        if (pct >= 80) valColor = 'var(--ef-color-func-success)';
        else if (pct >= 60) valColor = 'var(--ef-color-grass-300)';
        else if (pct >= 35) valColor = 'var(--ef-color-func-warning)';
        else valColor = 'var(--ef-color-func-danger)';
    }

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontFamily: 'var(--ef-font-family-body)'
        }}>
            <span style={{
                color: 'var(--ef-text-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
            }}>
                {icon && <span>{icon}</span>}
                {label}
            </span>
            <span style={{
                color: valColor,
                fontWeight: bold ? 700 : 500,
                fontFamily: typeof value === 'number' ? 'var(--ef-font-family-mono)' : 'var(--ef-font-family-body)'
            }}>
                {value}{suffix}
            </span>
        </div>
    );
}

export default EfStatLine;
