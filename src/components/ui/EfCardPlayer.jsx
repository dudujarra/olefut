/**
 * EfCardPlayer — Stitch component
 *
 * Player card com retrato 32×32 + nome + posição + 3 atributos com mini-progress.
 * 16-bit Brutalist Arcade edition.
 */

import { PlayerAvatar } from '../../utils/avatar';

const POSITION_COLOR = {
    GOL: 'var(--accent)',
    DEF: 'var(--info)',
    MEI: 'var(--primary)',
    ATA: 'var(--danger)'
};

function MiniBar({ value, max = 100, label }) {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    let color = 'var(--danger)';
    if (pct >= 80) color = 'var(--primary)';
    else if (pct >= 60) color = 'var(--color-success-mid)';
    else if (pct >= 35) color = 'var(--accent)';

    return (
        <div className="ef-minibar">
            <span className="ef-minibar-label">{label}</span>
            <div className="ef-minibar-track">
                <div 
                    className="ef-minibar-fill" 
                    style={{ width: `${pct}%`, background: color }} 
                />
            </div>
            <span className="ef-minibar-value">{value}</span>
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
            className={`ef-card-player ef-card-player-${isCol ? 'col' : 'row'} ${selected ? 'ef-selected' : ''}`}
            onClick={onClick}
            role={onClick ? 'button' : 'group'}
            tabIndex={onClick ? 0 : undefined}
        >
            <PlayerAvatar name={player.name} size={32} />

            <div className="ef-card-player-info">
                <div className="ef-card-player-header">
                    <strong className="ef-card-player-name">{player.name}</strong>
                    <span 
                        className="ef-card-player-pos" 
                        style={{ background: posColor }}
                    >
                        {player.position}
                    </span>
                </div>
                <div className="ef-card-player-meta">
                    OVR {player.ovr || '?'} · {player.age || '?'}a
                </div>

                {showAttrs && player.career && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                        <MiniBar value={player.energy ?? 100} label="ENE" />
                        <MiniBar value={player.moral ?? 50} label="MOR" />
                    </div>
                )}
            </div>

            {badge && (
                <div className="ef-card-player-badge">
                    {badge}
                </div>
            )}

            {children}
        </div>
    );
}

export default EfCardPlayer;
