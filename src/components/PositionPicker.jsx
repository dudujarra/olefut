/**
 * PositionPicker — SPEC-080
 *
 * Visual campo verde com 18 posições clickable.
 * Mostra fit % per player when hovering.
 */

import React from 'react';
import { POSITIONS, calculatePositionFit, calculateRatingForPosition, calculateEffectiveRating } from '../engine/Positions';

// Pitch coordinates per BR position code
const POSITION_COORDS = {
    GOL: { x: 50, y: 5 },
    LAE: { x: 15, y: 25 },
    ZAE: { x: 35, y: 20 },
    ZAG: { x: 50, y: 18 },
    ZAD: { x: 65, y: 20 },
    LAD: { x: 85, y: 25 },
    ALE: { x: 12, y: 38 },
    ALD: { x: 88, y: 38 },
    VOL: { x: 50, y: 38 },
    MCE: { x: 35, y: 50 },
    MEC: { x: 50, y: 52 },
    MCD: { x: 65, y: 50 },
    MPE: { x: 18, y: 62 },
    MEA: { x: 50, y: 65 },
    MPD: { x: 82, y: 62 },
    POE: { x: 22, y: 80 },
    CTA: { x: 50, y: 85 },
    POD: { x: 78, y: 80 }
};

export function PositionPicker({ player, onSelect, selectedPos = null }) {
    return (
        <div style={{
            position: 'relative',
            width: '100%',
            paddingBottom: '70%',
            background: 'linear-gradient(180deg, #2D5A3D 0%, #6ABC3A 100%)',
            borderRadius: '6px',
            border: '2px solid #2D5A3D',
            overflow: 'hidden'
        }}>
            {/* Pitch lines */}
            <div style={{
                position: 'absolute',
                inset: '4%',
                border: '2px solid rgba(255,255,255,0.5)',
                borderRadius: '4px',
                pointerEvents: 'none'
            }}>
                {/* Center line */}
                <div style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '50%',
                    height: '1px',
                    background: 'rgba(255,255,255,0.5)'
                }} />
                {/* Center circle */}
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '20%',
                    height: '14%',
                    border: '2px solid rgba(255,255,255,0.5)',
                    borderRadius: '50%'
                }} />
                {/* Goal areas */}
                {[5, 95].map(y => (
                    <div key={y} style={{
                        position: 'absolute',
                        left: '30%',
                        right: '30%',
                        ...(y < 50 ? { top: `${y}%` } : { bottom: `${100 - y}%` }),
                        height: '15%',
                        border: '2px solid rgba(255,255,255,0.5)',
                        borderTop: y > 50 ? '2px solid rgba(255,255,255,0.5)' : 'none',
                        borderBottom: y < 50 ? '2px solid rgba(255,255,255,0.5)' : 'none'
                    }} />
                ))}
            </div>

            {/* Position dots */}
            {Object.entries(POSITION_COORDS).map(([code, coord]) => {
                const pos = POSITIONS[code];
                const isSelected = selectedPos === code;
                const isNatural = player?.naturalPosition === code;

                let fitColor = 'rgba(255,255,255,0.5)';
                let ratingText = '';
                if (player) {
                    const fit = calculatePositionFit(player.naturalPosition, code);
                    const eff = calculateEffectiveRating(player, code);
                    ratingText = `${eff}`;
                    if (fit >= 1.0) fitColor = '#FFD700';      // gold (natural)
                    else if (fit >= 0.85) fitColor = '#6ABC3A';  // green (family)
                    else if (fit >= 0.6) fitColor = '#F7B538';   // yellow (adjacent)
                    else fitColor = '#D62828';                   // red (distant)
                }

                return (
                    <button
                        key={code}
                        onClick={() => onSelect?.(code)}
                        title={`${pos.name} (${pos.code})${player ? ' • Rating: ' + ratingText : ''}`}
                        style={{
                            position: 'absolute',
                            left: `${coord.x}%`,
                            top: `${100 - coord.y}%`,
                            transform: 'translate(-50%, -50%)',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: fitColor,
                            border: isSelected
                                ? '3px solid #FFFFFF'
                                : isNatural
                                    ? '2px solid #FFD700'
                                    : '1px solid rgba(0,0,0,0.4)',
                            color: '#0F1A14',
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 100ms steps(2)',
                            boxShadow: isSelected ? '0 0 12px #FFFFFF' : '0 2px 4px rgba(0,0,0,0.3)'
                        }}
                    >
                        {ratingText || code}
                    </button>
                );
            })}

            {/* Legend */}
            <div style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                background: 'rgba(0,0,0,0.6)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.65rem',
                color: '#fff',
                display: 'flex',
                gap: '6px'
            }}>
                <span style={{ color: '#FFD700' }}>●</span>Natural
                <span style={{ color: '#6ABC3A' }}>●</span>Família
                <span style={{ color: '#F7B538' }}>●</span>Adjacente
                <span style={{ color: '#D62828' }}>●</span>Fora
            </div>
        </div>
    );
}

export default PositionPicker;
