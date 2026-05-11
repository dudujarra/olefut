import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Tooltip } from './Tooltip';
import { EfClubBadge } from './ui/EfClubBadge';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';
import bgOffice from '../assets/environments/bg_league_table.png';
import { Trophy, CaretUp, CaretDown, AirplaneTilt, MapPin } from '@phosphor-icons/react';

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
        if (isTop4) return 'zone-promotion';
    }
    return '';
}

function getZoneBorderColor(zoneClass) {
    if (zoneClass.includes('libertadores')) return '#39FF14';
    if (zoneClass.includes('suda')) return '#FFD700';
    if (zoneClass.includes('promotion')) return '#40BAF7';
    if (zoneClass.includes('rebaixamento')) return '#FF3333';
    return 'transparent';
}

const SERIE_NAMES = { 1: 'SÉRIE A', 2: 'SÉRIE B', 3: 'SÉRIE C', 4: 'SÉRIE D' };

export function StandingsView() {
    const { gameState, changeView, getEngine } = useGame();
    const engine = getEngine();
    const userTeam = engine.getTeam(gameState.teamId);
    const [activeZone, setActiveZone] = useState(userTeam?.zone || 'BRA');
    const [activeDiv, setActiveDiv] = useState(userTeam?.division || 1);

    const standings = engine.getStandings(activeZone, activeDiv);
    const zones = [...new Set(engine.teams.map(t => t.zone))];
    const divs = [...new Set(engine.teams.filter(t => t.zone === activeZone).map(t => t.division))].sort();

    const back = gameState.mode === 'player' ? 'player_dashboard' : 'dashboard';
    const fontMono = { fontFamily: "'JetBrains Mono', 'Geist Mono', monospace" };

    return (
        <div className="ef-anim-fade-in ef-layout-pitch" style={{ backgroundImage: `url(${bgOffice})` }}>
            <div className="ef-layout-container" style={{ maxWidth: '1000px' }}>
                
                {/* HERO PANEL */}
                <EfPanel variant="elev" padding="md" className="ef-flex-row" style={{ justifyContent: 'space-between' }}>
                    <div className="ef-flex-row">
                        <Trophy size={32} color="var(--primary)" weight="duotone" />
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)', fontFamily: 'Satoshi, sans-serif' }}>
                                Classificação
                            </h2>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', ...fontMono }}>
                                {activeZone} / {SERIE_NAMES[activeDiv] || `DIV ${activeDiv}`}
                            </div>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="sm" onClick={() => changeView(back)}>VOLTAR</EfButton>
                </EfPanel>

                {/* BENTO CONTROLS */}
                <EfPanel variant="sunk" padding="sm" className="ef-flex-row-wrap" style={{ gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', flex: '1 1 auto', alignItems: 'center' }}>
                        <MapPin size={16} color="var(--text-muted)" />
                        {zones.map(z => (
                            <EfButton 
                                key={z} 
                                variant={activeZone === z ? 'primary' : 'secondary'} 
                                size="sm" 
                                onClick={() => { setActiveZone(z); setActiveDiv(1); }} 
                                style={{ flex: 1, minWidth: '60px' }}
                            >
                                {z}
                            </EfButton>
                        ))}
                    </div>
                    {divs.length > 1 && (
                        <div style={{ display: 'flex', gap: '8px', flex: '1 1 auto', alignItems: 'center', borderLeft: '2px solid var(--border-panel)', paddingLeft: '12px' }}>
                            <Trophy size={16} color="var(--text-muted)" />
                            {divs.map(d => (
                                <EfButton 
                                    key={d} 
                                    variant={activeDiv === d ? 'primary' : 'secondary'} 
                                    size="sm" 
                                    onClick={() => setActiveDiv(d)} 
                                    style={{ flex: 1 }}
                                >
                                    {SERIE_NAMES[d] || `DIV ${d}`}
                                </EfButton>
                            ))}
                        </div>
                    )}
                </EfPanel>

                {/* LEGEND BENTO */}
                <EfPanel variant="sunk" padding="sm" className="ef-flex-row-wrap" style={{ justifyContent: 'center', gap: '16px' }}>
                    {activeDiv === 1 && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', ...fontMono }}>
                                <AirplaneTilt size={14} color="#39FF14" weight="fill" /> 
                                <span style={{ color: 'var(--text-muted)' }}>LIBERTADORES</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', ...fontMono }}>
                                <AirplaneTilt size={14} color="#FFD700" weight="fill" /> 
                                <span style={{ color: 'var(--text-muted)' }}>SUL-AMERICANA</span>
                            </div>
                        </>
                    )}
                    {activeDiv > 1 && activeDiv <= 4 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', ...fontMono }}>
                            <CaretUp size={16} color="#40BAF7" weight="bold" /> 
                            <span style={{ color: 'var(--text-muted)' }}>ACESSO</span>
                        </div>
                    )}
                    {activeDiv < 4 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', ...fontMono }}>
                            <CaretDown size={16} color="#FF3333" weight="bold" /> 
                            <span style={{ color: 'var(--text-muted)' }}>REBAIXAMENTO</span>
                        </div>
                    )}
                </EfPanel>

                {/* TABLE */}
                <div className="ef-panel ef-panel-default ef-panel-p-none" style={{ overflowX: 'auto', background: 'var(--bg-dark)' }}>
                    <table className="ef-table">
                        <thead style={{ background: 'var(--bg-panel)' }}>
                            <tr>
                                <th style={{ textAlign:'center', width: '40px' }}>#</th>
                                <th style={{ textAlign:'left' }}>TIME</th>
                                <Tooltip content="Pontos"><th style={{ textAlign:'center', color: 'var(--accent)' }}>P</th></Tooltip>
                                <Tooltip content="Jogos"><th style={{ textAlign:'center' }}>J</th></Tooltip>
                                <Tooltip content="Vitórias"><th style={{ textAlign:'center', color: 'var(--primary)' }}>V</th></Tooltip>
                                <Tooltip content="Empates"><th style={{ textAlign:'center', color: 'var(--accent)' }}>E</th></Tooltip>
                                <Tooltip content="Derrotas"><th style={{ textAlign:'center', color: 'var(--danger)' }}>D</th></Tooltip>
                                <Tooltip content="Gols Pró"><th style={{ textAlign:'center' }}>GP</th></Tooltip>
                                <Tooltip content="Gols Contra"><th style={{ textAlign:'center' }}>GC</th></Tooltip>
                                <Tooltip content="Saldo"><th style={{ textAlign:'center' }}>SG</th></Tooltip>
                            </tr>
                        </thead>
                        <tbody>
                            {standings.map((s, i) => {
                                const t = engine.getTeam(s.teamId);
                                const pos = i + 1;
                                const zoneClass = getZoneClass(pos, standings.length, activeDiv);
                                const isUser = s.teamId === userTeam?.id;
                                const zoneBorderColor = getZoneBorderColor(zoneClass);
                                
                                // Solid colors enforcing Zero-Transparency
                                const rowBg = isUser ? '#102A10' : (i % 2 === 0 ? 'var(--bg-dark)' : 'var(--bg-panel)');
                                
                                return (
                                    <tr key={s.teamId} style={{
                                        background: rowBg,
                                        borderLeft: `4px solid ${zoneBorderColor}`,
                                        borderBottom: '1px solid var(--border-panel)'
                                    }}>
                                        <td style={{ padding:'12px 6px', textAlign:'center', color: pos <= 4 ? 'var(--accent)' : 'var(--text-muted)', ...fontMono }}>
                                            {pos}
                                        </td>
                                        <td style={{ padding:'12px 6px', textAlign:'left' }}>
                                            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                                {t?.name && <EfClubBadge name={t.name} size="sm" />}
                                                <span style={{ color: isUser ? 'var(--primary)' : 'var(--text-main)', fontWeight: isUser ? 700 : 500, fontFamily: 'Satoshi, sans-serif' }}>
                                                    {t?.name || `TIME ${s.teamId}`}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding:'12px 6px', textAlign:'center', color: 'var(--accent)', fontWeight: 'bold', ...fontMono }}>{s.points}</td>
                                        <td style={{ padding:'12px 6px', textAlign:'center', color: 'var(--text-muted)', ...fontMono }}>{s.played}</td>
                                        <td style={{ padding:'12px 6px', textAlign:'center', color: 'var(--primary)', ...fontMono }}>{s.won}</td>
                                        <td style={{ padding:'12px 6px', textAlign:'center', color: 'var(--accent)', ...fontMono }}>{s.drawn}</td>
                                        <td style={{ padding:'12px 6px', textAlign:'center', color: 'var(--danger)', ...fontMono }}>{s.lost}</td>
                                        <td style={{ padding:'12px 6px', textAlign:'center', color: 'var(--text-muted)', ...fontMono }}>{s.goalsFor}</td>
                                        <td style={{ padding:'12px 6px', textAlign:'center', color: 'var(--text-muted)', ...fontMono }}>{s.goalsAgainst}</td>
                                        <td style={{ padding:'12px 6px', textAlign:'center', color: (s.goalsFor - s.goalsAgainst) >= 0 ? 'var(--primary)' : 'var(--danger)', fontWeight: 600, ...fontMono }}>
                                            {s.goalsFor - s.goalsAgainst >= 0 ? '+' : ''}{s.goalsFor - s.goalsAgainst}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

