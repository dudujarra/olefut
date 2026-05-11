/* eslint-disable no-unused-vars */
/**
 * HexagonChart — SPEC-080
 *
 * Radar chart 6 attrs (FIN/TEC/CRI/TAC/DEF/FIS or GOL variants).
 * SVG-based, sem libs externas.
 */

import React from 'react';

export function HexagonChart({ player, size = 200, showLabels = true }) {
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.4;

    // 6 vertices spaced evenly
    const angle = (i) => (Math.PI * 2 * i) / 6 - Math.PI / 2;

    const p = player || {};
    
    // SCHEMA-UNIFIED: lê direto das chaves root-level geradas por data.js
    // Configura 6 eixos baseado na posição
    let chartAttrs = [];
    if (p.position === 'GOL' || p.naturalPosition === 'GOL') {
        chartAttrs = [
            { key: 'DEF', label: 'REF', value: p.defending || 50, color: '#3A7DCE' },
            { key: 'TAC', label: 'POS', value: p.tactical || 50, color: '#7B2CBF' },
            { key: 'TEC', label: 'TEC', value: p.technical || 50, color: '#FFD700' },
            { key: 'CRI', label: 'SAI', value: p.creativity || 50, color: '#E59866' },
            { key: 'OVR', label: 'OVR', value: p.ovr || 50, color: '#39FF14' },
            { key: 'POT', label: 'POT', value: p.potential || p.ovr || 50, color: '#40BAF7' }
        ];
    } else {
        chartAttrs = [
            { key: 'ATK', label: 'ATK', value: p.attacking || 50, color: '#D62828' },
            { key: 'TEC', label: 'TEC', value: p.technical || 50, color: '#3A7DCE' },
            { key: 'CRI', label: 'CRI', value: p.creativity || 50, color: '#FFD700' },
            { key: 'TAC', label: 'TAC', value: p.tactical || 50, color: '#7B2CBF' },
            { key: 'DEF', label: 'DEF', value: p.defending || 50, color: '#2D5A3D' },
            { key: 'OVR', label: 'OVR', value: p.ovr || 50, color: '#39FF14' }
        ];
    }

    // Background hexagon
    const bgPoints = chartAttrs.map((_, i) => {
        const a = angle(i);
        return `${cx + radius * Math.cos(a)},${cy + radius * Math.sin(a)}`;
    }).join(' ');

    // Player values hexagon
    const playerPoints = chartAttrs.map((attr, i) => {
        const value = Math.max(1, Math.min(100, attr.value)) / 100;
        const a = angle(i);
        return `${cx + radius * value * Math.cos(a)},${cy + radius * value * Math.sin(a)}`;
    }).join(' ');

    // Concentric rings (25/50/75/100)
    const rings = [0.25, 0.5, 0.75, 1.0].map(r => {
        return chartAttrs.map((_, i) => {
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
                    stroke="#0E1F14"
                    strokeWidth="1"
                />
            ))}

            {/* Axis lines */}
            {chartAttrs.map((_, i) => {
                const a = angle(i);
                return (
                    <line
                        key={i}
                        x1={cx}
                        y1={cy}
                        x2={cx + radius * Math.cos(a)}
                        y2={cy + radius * Math.sin(a)}
                        stroke="#0E1F14"
                        strokeWidth="1"
                    />
                );
            })}

            {/* Player polygon (filled) */}
            <polygon
                points={playerPoints}
                fill="#1B4332"
                stroke="#39FF14"
                strokeWidth="2"
                style={{ opacity: 0.8 }}
            />

            {/* Vertex dots colored per attr */}
            {chartAttrs.map((attr, i) => {
                const value = Math.max(1, Math.min(100, attr.value)) / 100;
                const a = angle(i);
                const x = cx + radius * value * Math.cos(a);
                const y = cy + radius * value * Math.sin(a);
                return (
                    <circle key={attr.key} cx={x} cy={y} r="4" fill={attr.color} stroke="#0F1A14" strokeWidth="1" />
                );
            })}

            {/* Labels */}
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
                            {Math.round(attr.value)}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

export default HexagonChart;
