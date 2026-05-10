/**
 * EfCardPlayer — Stitch component
 *
 * Player card com retrato 32×32 + nome + posição + 3 atributos com mini-progress.
 * 16-bit Brutalist Arcade edition.
 */

import React from 'react';

const POSITION_COLOR = {
    GOL: '#FFD700',
    DEF: '#40BAF7',
    MEI: '#39FF14',
    ATA: '#FF3333'
};

function MiniBar({ value, max = 100, label }) {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    let color = '#FF3333';
    if (pct >= 80) color = '#39FF14';
    else if (pct >= 60) color = '#6ABC3A';
    else if (pct >= 35) color = '#FFD700';

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
            <span style={{ color: '#888', minWidth: '24px', fontFamily: "'Press Start 2P', monospace", fontSize: '0.4rem' }}>{label}</span>
            <div style={{
                flex: 1,
                height: '6px',
                background: '#111417',
                border: '2px solid #000',
                position: 'relative'
            }}>
                <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: color,
                    transition: 'width 0.2s ease-out'
                }} />
            </div>
            <span style={{ color: '#E2E8F0', minWidth: '20px', textAlign: 'right', fontFamily: 'monospace' }}>{value}</span>
        </div>
    );
}

export function EfCardPlayer({
    player,
    layout = 'row',
    showAttrs = true,
    onClick,
    selected = false,
    badge,
    children
}) {
    if (!player) return null;

    const isCol = layout === 'column';
    const posColor = POSITION_COLOR[player.position] || '#888';

    return (
        <div
            className={`ef-card-player ${selected ? 'ef-selected' : ''}`}
            onClick={onClick}
            role={onClick ? 'button' : 'group'}
            tabIndex={onClick ? 0 : undefined}
            style={{
                display: 'flex',
                flexDirection: isCol ? 'column' : 'row',
                alignItems: isCol ? 'center' : 'flex-start',
                gap: '12px',
                padding: '12px',
                background: '#1E2124',
                border: '4px solid',
                borderColor: selected
                    ? '#40BAF7'
                    : '#4A5059 #111417 #111417 #4A5059',
                boxShadow: selected ? '0 0 0 2px #40BAF7' : '2px 4px 0 rgba(0,0,0,0.5)',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'transform 0.1s',
                position: 'relative',
                minWidth: isCol ? '120px' : '200px'
            }}
            onMouseEnter={(e) => onClick && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => onClick && (e.currentTarget.style.transform = 'translateY(0)')}
        >
            {/* Avatar 32×32 */}
            <div style={{
                width: '32px',
                height: '32px',
                background: posColor,
                border: '3px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Press Start 2P', monospace",
                fontWeight: 700,
                fontSize: '12px',
                color: '#0A130E',
                flexShrink: 0,
                imageRendering: 'pixelated'
            }}>
                {player.position?.[0] || '?'}
            </div>

            {/* Info */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', textAlign: isCol ? 'center' : 'left' }}>
                <div style={{ display: 'flex', justifyContent: isCol ? 'center' : 'space-between', alignItems: 'center', gap: '4px' }}>
                    <strong style={{ fontSize: '14px', color: '#E2E8F0' }}>{player.name}</strong>
                    <span style={{
                        fontSize: '10px',
                        padding: '2px 4px',
                        background: posColor,
                        color: '#0A130E',
                        fontWeight: 700,
                        fontFamily: "'Press Start 2P', monospace"
                    }}>{player.position}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#888', fontFamily: 'monospace' }}>
                    OVR {player.ovr || '?'} · {player.age || '?'}a
                </div>

                {showAttrs && player.career && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                        <MiniBar value={player.energy ?? 100} label="ENE" />
                        <MiniBar value={player.moral ?? 50} label="MOR" />
                    </div>
                )}
            </div>

            {/* Badge */}
            {badge && (
                <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    padding: '2px 6px',
                    background: '#FFD700',
                    color: '#0A130E',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '10px',
                    fontWeight: 700,
                    border: '3px solid #000'
                }}>
                    {badge}
                </div>
            )}

            {children}
        </div>
    );
}

export default EfCardPlayer;
