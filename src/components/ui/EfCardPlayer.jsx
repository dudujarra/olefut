/**
 * EfCardPlayer — Stitch component
 *
 * Player card com retrato 32×32 + nome + posição + 3 atributos com mini-progress.
 */

import React from 'react';

const POSITION_COLOR = {
    GOL: 'var(--ef-color-br-yellow)',
    DEF: 'var(--ef-color-func-info)',
    MEI: 'var(--ef-color-grass-300)',
    ATA: 'var(--ef-color-func-danger)'
};

function MiniBar({ value, max = 100, label }) {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    let color = 'var(--ef-color-func-danger)';
    if (pct >= 80) color = 'var(--ef-color-func-success)';
    else if (pct >= 60) color = 'var(--ef-color-grass-300)';
    else if (pct >= 35) color = 'var(--ef-color-func-warning)';

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
            <span style={{ color: 'var(--ef-text-md)', minWidth: '24px' }}>{label}</span>
            <div style={{
                flex: 1,
                height: '6px',
                background: 'var(--ef-bevel-dark)',
                border: '1px solid var(--ef-bevel-dark)',
                position: 'relative'
            }}>
                <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: color,
                    transition: 'width var(--ef-dur-normal) var(--ef-ease-out-quart)'
                }} />
            </div>
            <span style={{ color: 'var(--ef-text-hi)', minWidth: '20px', textAlign: 'right', fontFamily: 'var(--ef-font-family-mono)' }}>{value}</span>
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
    const posColor = POSITION_COLOR[player.position] || 'var(--ef-text-md)';

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
                gap: 'var(--ef-space-3)',
                padding: 'var(--ef-space-3)',
                background: 'var(--ef-bg-card)',
                border: '2px solid',
                borderColor: selected
                    ? 'var(--ef-color-func-info)'
                    : 'var(--ef-bevel-light) var(--ef-bevel-dark) var(--ef-bevel-dark) var(--ef-bevel-light)',
                boxShadow: selected ? '0 0 0 2px var(--ef-color-func-info)' : 'var(--ef-shadow-drop)',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'transform var(--ef-dur-normal), border-color var(--ef-dur-normal)',
                position: 'relative',
                minWidth: isCol ? '120px' : '200px'
            }}
            onMouseEnter={(e) => onClick && (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => onClick && (e.currentTarget.style.transform = 'scale(1)')}
        >
            {/* Avatar 32×32 */}
            <div style={{
                width: '32px',
                height: '32px',
                background: posColor,
                border: '2px solid var(--ef-bevel-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--ef-font-family-mono)',
                fontWeight: 700,
                fontSize: '14px',
                color: 'var(--ef-color-neutral-bg)',
                flexShrink: 0,
                imageRendering: 'pixelated'
            }}>
                {player.position?.[0] || '?'}
            </div>

            {/* Info */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', textAlign: isCol ? 'center' : 'left' }}>
                <div style={{ display: 'flex', justifyContent: isCol ? 'center' : 'space-between', alignItems: 'center', gap: '4px' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--ef-text-hi)' }}>{player.name}</strong>
                    <span style={{
                        fontSize: '10px',
                        padding: '2px 4px',
                        background: posColor,
                        color: 'var(--ef-color-neutral-bg)',
                        fontWeight: 700,
                        fontFamily: 'var(--ef-font-family-mono)'
                    }}>{player.position}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ef-text-md)', fontFamily: 'var(--ef-font-family-mono)' }}>
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
                    background: 'var(--ef-color-func-warning)',
                    color: 'var(--ef-color-neutral-bg)',
                    fontFamily: 'var(--ef-font-family-mono)',
                    fontSize: '10px',
                    fontWeight: 700,
                    border: '2px solid var(--ef-bevel-dark)'
                }}>
                    {badge}
                </div>
            )}

            {children}
        </div>
    );
}

export default EfCardPlayer;
