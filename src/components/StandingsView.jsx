import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Tooltip } from './Tooltip';
import { EfClubBadge } from './ui/EfClubBadge';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';
import bgOffice from '../assets/environments/bg_manager_office.png';

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
        <div className="ef-anim-fade-in" style={{
            backgroundImage: `linear-gradient(to bottom, rgba(11, 15, 25, 0.8), rgba(11, 15, 25, 0.95)), url(${bgOffice})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            minHeight: '100dvh',
            padding: '16px',
            color: 'var(--ef-color-neutral-text-hi)'
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <EfPanel variant="elev" padding="md" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px', flexWrap: 'wrap'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <h2 style={{fontSize:'1.2rem',margin:0}}>📊 CLASSIFICAÇÃO</h2>
                </div>
                <EfButton variant="secondary" size="sm" onClick={() => changeView(back)}>← Voltar</EfButton>
            </EfPanel>

            <EfPanel variant="sunk" padding="md">
            {/* Legend */}
            <div className="standings-legend" style={{display:'flex',gap:'1rem',flexWrap:'wrap',fontSize:'0.78rem',marginBottom:'0.5rem',justifyContent:'center'}}>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '8px', marginBottom: '8px' }}>
                {zones.map(z => (
                    <EfButton key={z} variant={activeZone === z ? 'primary' : 'secondary'} size="sm" onClick={() => { setActiveZone(z); setActiveDiv(1); }} style={{justifyContent: 'center'}}>
                        {z}
                    </EfButton>
                ))}
            </div>

            {divs.length > 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '8px', marginBottom: '8px' }}>
                    {divs.map(d => (
                        <EfButton key={d} variant={activeDiv === d ? 'primary' : 'secondary'} size="sm" onClick={() => setActiveDiv(d)} style={{justifyContent: 'center'}}>
                            Div {d}
                        </EfButton>
                    ))}
                </div>
            )}

            <div style={{ overflowX: 'auto', border: '2px solid var(--ef-bevel-dark)' }}>
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
            </EfPanel>
            </div>
        </div>
    );
}
