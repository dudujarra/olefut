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
    let valColorClass = 'text-color-soft-text';

    if (!color && typeof barValue === 'number') {
        const pct = (barValue / barMax) * 100;
        if (pct >= 80) valColorClass = 'text-primary';
        else if (pct >= 60) valColorClass = 'text-color-success-mid';
        else if (pct >= 35) valColorClass = 'text-accent';
        else valColorClass = 'text-danger';
    }

    const customColorStyle = color && !valColorClass.includes('text-') ? { color: color } : {};

    return (
        <div className="ef-stat-line flex justify-between items-center gap-2 text-[13px] font-display">
            <span className="ef-stat-line-label text-color-muted flex items-center gap-1 text-[0.5rem]">
                {icon && <span>{icon}</span>}
                {label}
            </span>
            <span 
                className={`ef-stat-line-value ${color ? '' : valColorClass} ${bold ? 'font-bold' : 'font-medium'} ${typeof value === 'number' ? 'font-mono' : 'font-display'} text-[0.6rem]`}
                style={customColorStyle}
            >
                {value}{suffix}
            </span>
        </div>
    );
}

export default EfStatLine;
