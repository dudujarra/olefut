/**
 * HexagonChart — SPEC-080
 *
 * Radar chart 6 attrs (FIN/TEC/CRI/TAC/DEF/FIS or GOL variants).
 * SVG-based, sem libs externas.
 */
import '../styles/hexagon-chart.css';

export function HexagonChart({ player, size = 200, showLabels = true }) {
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.4;

    const angle = (i) => (Math.PI * 2 * i) / 6 - Math.PI / 2;

    const p = player || {};

    // SCHEMA-UNIFIED: lê direto das chaves root-level geradas por data.js
    let chartAttrs = [];
    if (p.position === 'GOL' || p.naturalPosition === 'GOL') {
        chartAttrs = [
            { key: 'DEF', label: 'REF', value: p.defending || 50, color: 'var(--ef-hex-azure)' },
            { key: 'TAC', label: 'POS', value: p.tactical || 50, color: 'var(--ef-hex-purple)' },
            { key: 'TEC', label: 'TEC', value: p.technical || 50, color: 'var(--accent)' },
            { key: 'CRI', label: 'SAI', value: p.creativity || 50, color: 'var(--ef-hex-salmon)' },
            { key: 'OVR', label: 'OVR', value: p.ovr || 50, color: 'var(--primary)' },
            { key: 'POT', label: 'POT', value: p.potential || p.ovr || 50, color: 'var(--ef-hex-info)' }
        ];
    } else {
        chartAttrs = [
            { key: 'ATK', label: 'ATK', value: p.attacking || 50, color: 'var(--ef-hex-red)' },
            { key: 'TEC', label: 'TEC', value: p.technical || 50, color: 'var(--ef-hex-azure)' },
            { key: 'CRI', label: 'CRI', value: p.creativity || 50, color: 'var(--accent)' },
            { key: 'TAC', label: 'TAC', value: p.tactical || 50, color: 'var(--ef-hex-purple)' },
            { key: 'DEF', label: 'DEF', value: p.defending || 50, color: 'var(--ef-hex-forest-dark)' },
            { key: 'OVR', label: 'OVR', value: p.ovr || 50, color: 'var(--primary)' }
        ];
    }

    const playerPoints = chartAttrs.map((attr, i) => {
        const value = Math.max(1, Math.min(100, attr.value)) / 100;
        const a = angle(i);
        return `${cx + radius * value * Math.cos(a)},${cy + radius * value * Math.sin(a)}`;
    }).join(' ');

    const rings = [0.25, 0.5, 0.75, 1.0].map(r => {
        return chartAttrs.map((_, i) => {
            const a = angle(i);
            return `${cx + radius * r * Math.cos(a)},${cy + radius * r * Math.sin(a)}`;
        }).join(' ');
    });

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ef-hex">
            {rings.map((points, i) => (
                <polygon
                    key={i}
                    points={points}
                    className="ef-hex__ring"
                />
            ))}

            {chartAttrs.map((_, i) => {
                const a = angle(i);
                return (
                    <line
                        key={i}
                        x1={cx}
                        y1={cy}
                        x2={cx + radius * Math.cos(a)}
                        y2={cy + radius * Math.sin(a)}
                        className="ef-hex__axis"
                    />
                );
            })}

            <polygon
                points={playerPoints}
                className="ef-hex__player-polygon"
            />

            {chartAttrs.map((attr, i) => {
                const value = Math.max(1, Math.min(100, attr.value)) / 100;
                const a = angle(i);
                const x = cx + radius * value * Math.cos(a);
                const y = cy + radius * value * Math.sin(a);
                return (
                    <circle key={attr.key} cx={x} cy={y} r="4" className="ef-hex__vertex-dot" style={{ fill: attr.color }} />
                );
            })}

            {showLabels && chartAttrs.map((attr, i) => {
                const a = angle(i);
                const labelRadius = radius * 1.18;
                const x = cx + labelRadius * Math.cos(a);
                const y = cy + labelRadius * Math.sin(a);
                return (
                    <g key={attr.key}>
                        <text
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="10"
                            fontWeight="700"
                            style={{ fill: attr.color }}
                        >
                            {attr.label}
                        </text>
                        <text
                            x={x}
                            y={y + 12}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="9"
                            className="ef-hex__value-text"
                        >
                            {Math.round(attr.value)}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

export default HexagonChart;
