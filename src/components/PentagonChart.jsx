/**
 * PentagonChart — SPEC-080
 *
 * Radar chart 5 attrs (Attacking/Technical/Tactical/Defending/Creativity).
 * SVG-based, sem libs externas.
 */

import React from 'react';

const ATTRS = [
    { key: 'attacking',  label: 'ATA', color: '#D62828' },
    { key: 'technical',  label: 'TEC', color: '#3A7DCE' },
    { key: 'tactical',   label: 'TAC', color: '#7B2CBF' },
    { key: 'defending',  label: 'DEF', color: '#2D5A3D' },
    { key: 'creativity', label: 'CRI', color: '#FFD700' }
];

export function PentagonChart({ player, size = 200, showLabels = true }) {
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.4;

    // 5 vertices spaced evenly
    const angle = (i) => (Math.PI * 2 * i) / 5 - Math.PI / 2;

    // Background pentagon (max scale 100)
    const bgPoints = ATTRS.map((_, i) => {
        const a = angle(i);
        return `${cx + radius * Math.cos(a)},${cy + radius * Math.sin(a)}`;
    }).join(' ');

    // Player values pentagon
    const playerPoints = ATTRS.map((attr, i) => {
        const value = (player?.[attr.key] ?? 50) / 100;
        const a = angle(i);
        return `${cx + radius * value * Math.cos(a)},${cy + radius * value * Math.sin(a)}`;
    }).join(' ');

    // Concentric rings (25/50/75/100)
    const rings = [0.25, 0.5, 0.75, 1.0].map(r => {
        return ATTRS.map((_, i) => {
            const a = angle(i);
            return `${cx + radius * r * Math.cos(a)},${cy + radius * r * Math.sin(a)}`;
        }).join(' ');
    });

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Concentric rings */}
            {rings.map((points, i) => (
                <polygon
                    key={i}
                    points={points}
                    fill="none"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="1"
                />
            ))}

            {/* Axis lines */}
            {ATTRS.map((_, i) => {
                const a = angle(i);
                return (
                    <line
                        key={i}
                        x1={cx}
                        y1={cy}
                        x2={cx + radius * Math.cos(a)}
                        y2={cy + radius * Math.sin(a)}
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="1"
                    />
                );
            })}

            {/* Player polygon (filled) */}
            <polygon
                points={playerPoints}
                fill="rgba(255, 215, 0, 0.35)"
                stroke="#FFD700"
                strokeWidth="2"
            />

            {/* Vertex dots colored per attr */}
            {ATTRS.map((attr, i) => {
                const value = (player?.[attr.key] ?? 50) / 100;
                const a = angle(i);
                const x = cx + radius * value * Math.cos(a);
                const y = cy + radius * value * Math.sin(a);
                return (
                    <circle key={attr.key} cx={x} cy={y} r="4" fill={attr.color} stroke="#0F1A14" strokeWidth="1" />
                );
            })}

            {/* Labels */}
            {showLabels && ATTRS.map((attr, i) => {
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
                            fill={attr.color}
                        >
                            {attr.label}
                        </text>
                        <text
                            x={x}
                            y={y + 12}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="9"
                            fill="#fff"
                        >
                            {player?.[attr.key] ?? '-'}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

export default PentagonChart;
