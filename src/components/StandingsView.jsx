import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Tooltip } from './Tooltip';
import { EfClubBadge } from './ui';

/**
 * Get zone class based on position + division
 * Top 4 (div 1) = Libertadores
 * 5-6 (div 1) = Sul-Americana
 * Last 4 = Rebaixamento (only if not div 4)
 * Top 4 in lower divisions = Promotion (verde)
 */
function getZoneClass(position, totalTeams, division) {
    const isLast = position > totalTeams - 4;
    const isTop4 = position <= 4;
    const isPos5to6 = position === 5 || position === 6;

    if (division === 1) {
        if (isTop4) return 'zone-libertadores';
        if (isPos5to6) return 'zone-suda';
        if (isLast) return 'zone-rebaixamento';
    } else if (division < 4) {
        if (isTop4) return 'zone-promotion';
        if (isLast) return 'zone-rebaixamento';
    } else {
        // Série D - só promotion no top
        if (isTop4) return 'zone-promotion';
    }
    return '';
}

function getZoneTooltip(position, totalTeams, division) {
    const isLast = position > totalTeams - 4;
    const isTop4 = position <= 4;
    const isPos5to6 = position === 5 || position === 6;

    if (division === 1) {
        if (isTop4) return 'Zona Libertadores: classifica para fase de grupos.';
        if (isPos5to6) return 'Zona Sul-Americana: classifica para Copa Sul-Americana.';
        if (isLast) return 'Zona de Rebaixamento: cai para Série B no fim da temporada.';
    } else if (division < 4) {
        if (isTop4) return `Zona de Acesso: sobe para Série ${['','A','B','C'][division-1]} no fim da temporada.`;
        if (isLast) return `Zona de Rebaixamento: cai para Série ${['','','C','D'][division-1]} no fim da temporada.`;
    } else {
        if (isTop4) return 'Zona de Acesso: sobe para Série C no fim da temporada.';
    }
    return null;
}

export function StandingsView() {
    const { gameState, changeView, getEngine } = useGame();
    const engine = getEngine();
    const userTeam = engine.getTeam(gameState.teamId);
    const [activeZone, setActiveZone] = useState(userTeam?.zone || 'BRA');
    const [activeDiv, setActiveDiv] = useState(userTeam?.division || 1);

    const standings = engine.getStandings(activeZone, activeDiv);

    // Get all zones
    const zones = [...new Set(engine.teams.map(t => t.zone))];
    // Get divisions for active zone
    const divs = [...new Set(engine.teams.filter(t => t.zone === activeZone).map(t => t.division))].sort();

    const back = gameState.mode === 'player' ? 'player_dashboard' : 'dashboard';

    return (
        <div className="main-content fade-in ef-art-bg ef-art-state-arrows">
            <div className="card-header" style={{ marginBottom: '1rem' }}>
                <h2>📊 Classificação</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => changeView(back)}>← Voltar</button>
            </div>

            {/* Legend */}
            <div className="standings-legend" style={{display:'flex',gap:'1rem',flexWrap:'wrap',fontSize:'0.78rem',marginBottom:'0.5rem'}}>
                {activeDiv === 1 && (
                    <>
                        <Tooltip content="Top 4: classifica para Libertadores"><span className="zone-dot zone-libertadores">●</span> <span style={{marginLeft:4}}>Libertadores</span></Tooltip>
                        <Tooltip content="5º-6º: Copa Sul-Americana"><span className="zone-dot zone-suda">●</span> <span style={{marginLeft:4}}>Sul-Americana</span></Tooltip>
                    </>
                )}
                {activeDiv > 1 && activeDiv <= 4 && (
                    <Tooltip content={`Top 4: sobe para Série ${['','A','B','C'][activeDiv-1]}`}><span className="zone-dot zone-promotion">●</span> <span style={{marginLeft:4}}>Acesso</span></Tooltip>
                )}
                {activeDiv < 4 && (
                    <Tooltip content="Últimos 4: rebaixamento para divisão inferior"><span className="zone-dot zone-rebaixamento">●</span> <span style={{marginLeft:4}}>Rebaixamento</span></Tooltip>
                )}
            </div>

            <div className="nav-tabs">
                {zones.map(z => (
                    <button key={z} className={`nav-tab ${activeZone === z ? 'active' : ''}`} onClick={() => { setActiveZone(z); setActiveDiv(1); }}>
                        {z}
                    </button>
                ))}
            </div>

            {divs.length > 1 && (
                <div className="nav-tabs">
                    {divs.map(d => (
                        <button key={d} className={`nav-tab ${activeDiv === d ? 'active' : ''}`} onClick={() => setActiveDiv(d)}>
                            Div {d}
                        </button>
                    ))}
                </div>
            )}

            <div style={{ overflowX: 'auto' }}>
                <table className="standings-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Time</th>
                            <Tooltip content="Pontos: 3 por vitória, 1 por empate"><th>P</th></Tooltip>
                            <Tooltip content="Jogos disputados"><th>J</th></Tooltip>
                            <Tooltip content="Vitórias"><th>V</th></Tooltip>
                            <Tooltip content="Empates"><th>E</th></Tooltip>
                            <Tooltip content="Derrotas"><th>D</th></Tooltip>
                            <Tooltip content="Gols pró"><th>GP</th></Tooltip>
                            <Tooltip content="Gols contra"><th>GC</th></Tooltip>
                            <Tooltip content="Saldo de gols"><th>SG</th></Tooltip>
                        </tr>
                    </thead>
                    <tbody>
                        {standings.map((s, i) => {
                            const t = engine.getTeam(s.teamId);
                            const pos = i + 1;
                            const zoneClass = getZoneClass(pos, standings.length, activeDiv);
                            const zoneTooltip = getZoneTooltip(pos, standings.length, activeDiv);
                            const isUser = s.teamId === userTeam?.id;
                            const rowClass = `${zoneClass} ${isUser ? 'highlight ef-anim-pulse-glow' : ''}`.trim();
                            const row = (
                                <tr key={s.teamId} className={rowClass}>
                                    <td>
                                        {pos <= 4 && <span className={`ef-trophy-icon ef-trophy-tier-${pos}`} style={{width:'16px',height:'20px',backgroundSize:'64px 40px',backgroundPosition:`-${(pos-1)*16}px 0`,verticalAlign:'middle',marginRight:'4px'}} aria-hidden="true" />}
                                        {pos}
                                    </td>
                                    <td style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                        {t?.name && <EfClubBadge name={t.name} size="sm" />}
                                        <span>{t?.name || `Time ${s.teamId}`}</span>
                                    </td>
                                    <td><strong>{s.points}</strong></td>
                                    <td>{s.played}</td>
                                    <td>{s.won}</td>
                                    <td>{s.drawn}</td>
                                    <td>{s.lost}</td>
                                    <td>{s.goalsFor}</td>
                                    <td>{s.goalsAgainst}</td>
                                    <td>{s.goalsFor - s.goalsAgainst}</td>
                                </tr>
                            );
                            return row;
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
