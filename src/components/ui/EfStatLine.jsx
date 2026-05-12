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
    let valColor = color || '#E2E8F0';

    if (!color && typeof barValue === 'number') {
        const pct = (barValue / barMax) * 100;
        if (pct >= 80) valColor = '#39FF14';
        else if (pct >= 60) valColor = '#6ABC3A';
        else if (pct >= 35) valColor = '#FFD700';
        else valColor = '#FF3333';
    }

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontFamily: "'Press Start 2P', monospace"
        }}>
            <span style={{
                color: '#888',
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
                fontFamily: typeof value === 'number' ? "monospace" : "'Press Start 2P', monospace",
                fontSize: '0.6rem'
            }}>
                {value}{suffix}
            </span>
        </div>
    );
}

export default EfStatLine;
