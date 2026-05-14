/**
 * EfStatLine — inline stat com label + value + optional bar.
 *
 * Used em painéis denso (Dashboard ISS-style).
 */

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
    let valColor = color || 'var(--color-soft-text)';

    if (!color && typeof barValue === 'number') {
        const pct = (barValue / barMax) * 100;
        if (pct >= 80) valColor = 'var(--primary)';
        else if (pct >= 60) valColor = 'var(--color-success-mid)';
        else if (pct >= 35) valColor = 'var(--accent)';
        else valColor = 'var(--danger)';
    }

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontFamily: 'var(--font-display)'
        }}>
            <span style={{
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.5rem'
            }}>
                {icon && <span>{icon}</span>}
                {label}
            </span>
            <span style={{
                color: valColor,
                fontWeight: bold ? 700 : 500,
                fontFamily: typeof value === 'number' ? 'var(--font-mono)' : 'var(--font-display)',
                fontSize: '0.6rem'
            }}>
                {value}{suffix}
            </span>
        </div>
    );
}

export default EfStatLine;
