import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Tooltip } from './Tooltip';
import { EfClubBadge } from './ui/EfClubBadge';
import { EfButton } from './ui/EfButton';
import bgOffice from '../assets/environments/bg_league_table.png';

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

    // Get all zones
    const zones = [...new Set(engine.teams.map(t => t.zone))];
    // Get divisions for active zone
    const divs = [...new Set(engine.teams.filter(t => t.zone === activeZone).map(t => t.division))].sort();

    const back = gameState.mode === 'player' ? 'player_dashboard' : 'dashboard';

    return (
        <div className="ef-anim-fade-in" style={{
            backgroundImage: `url(${bgOffice})`,
            imageRendering: 'pixelated',
            WebkitImageRendering: 'pixelated',
            backgroundColor: '#0A130E',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            minHeight: '100dvh',
            padding: '16px',
            color: '#E2E8F0',
            fontFamily: "'Outfit', sans-serif"
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* HEADER */}
                <div style={{
                    background: '#1E2124',
                    border: '4px solid',
                    borderColor: '#4A5059 #111417 #111417 #4A5059',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 8px 0 rgba(0,0,0,0.8)'
                }}>
                    <h2 style={{fontFamily: "'Press Start 2P', monospace", color: '#FFD700', margin: 0, fontSize: '1.1rem', textShadow: '3px 3px 0 #000'}}>
                        CLASSIFICAÇÃO — {SERIE_NAMES[activeDiv] || `DIV ${activeDiv}`}
                    </h2>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(back)}>SAIR</EfButton>
                </div>

                {/* LEGEND */}
                <div style={{
                    background: '#111',
                    border: '4px solid',
                    borderColor: '#333 #000 #000 #333',
                    padding: '12px',
                    display: 'flex',
                    gap: '24px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    {activeDiv === 1 && (
                        <>
                            <Tooltip content="Top 4: classifica para Libertadores">
                                <span style={{display:'flex',alignItems:'center',gap:'6px',fontFamily:"'Press Start 2P', monospace",fontSize:'0.55rem'}}>
                                    <span style={{width:'12px',height:'12px',background:'#39FF14',border:'2px solid #000',display:'inline-block'}} /> LIBERTADORES
                                </span>
                            </Tooltip>
                            <Tooltip content="5º-6º: Copa Sul-Americana">
                                <span style={{display:'flex',alignItems:'center',gap:'6px',fontFamily:"'Press Start 2P', monospace",fontSize:'0.55rem'}}>
                                    <span style={{width:'12px',height:'12px',background:'#FFD700',border:'2px solid #000',display:'inline-block'}} /> SUL-AMERICANA
                                </span>
                            </Tooltip>
                        </>
                    )}
                    {activeDiv > 1 && activeDiv <= 4 && (
                        <Tooltip content={`Top 4: sobe para Série ${['','A','B','C'][activeDiv-1]}`}>
                            <span style={{display:'flex',alignItems:'center',gap:'6px',fontFamily:"'Press Start 2P', monospace",fontSize:'0.55rem'}}>
                                <span style={{width:'12px',height:'12px',background:'#40BAF7',border:'2px solid #000',display:'inline-block'}} /> ACESSO
                            </span>
                        </Tooltip>
                    )}
                    {activeDiv < 4 && (
                        <Tooltip content="Últimos 4: rebaixamento para divisão inferior">
                            <span style={{display:'flex',alignItems:'center',gap:'6px',fontFamily:"'Press Start 2P', monospace",fontSize:'0.55rem'}}>
                                <span style={{width:'12px',height:'12px',background:'#FF3333',border:'2px solid #000',display:'inline-block'}} /> REBAIXAMENTO
                            </span>
                        </Tooltip>
                    )}
                </div>

                {/* ZONE SELECTOR */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {zones.map(z => (
                        <EfButton key={z} variant={activeZone === z ? 'primary' : 'secondary'} size="md" onClick={() => { setActiveZone(z); setActiveDiv(1); }} style={{flex: 1, minWidth: '80px'}}>
                            {z}
                        </EfButton>
                    ))}
                </div>

                {/* DIVISION SELECTOR */}
                {divs.length > 1 && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {divs.map(d => (
                            <EfButton key={d} variant={activeDiv === d ? 'primary' : 'secondary'} size="md" onClick={() => setActiveDiv(d)} style={{flex: 1}}>
                                {SERIE_NAMES[d] || `DIV ${d}`}
                            </EfButton>
                        ))}
                    </div>
                )}

                {/* TABLE */}
                <div style={{
                    backgroundColor: '#1E2124',
                    border: '4px solid',
                    borderColor: '#4A5059 #111417 #111417 #4A5059',
                    boxShadow: '0 16px 0 rgba(0,0,0,0.5)',
                    padding: '0',
                    overflowX: 'auto'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '4px solid #4A5059', color: '#888' }}>
                                <th style={{padding:'12px 6px', textAlign:'center'}}>#</th>
                                <th style={{padding:'12px 6px', textAlign:'left'}}>TIME</th>
                                <Tooltip content="Pontos: 3 por vitória, 1 por empate"><th style={{padding:'12px 6px', textAlign:'center', color: '#FFD700'}}>P</th></Tooltip>
                                <Tooltip content="Jogos disputados"><th style={{padding:'12px 6px', textAlign:'center'}}>J</th></Tooltip>
                                <Tooltip content="Vitórias"><th style={{padding:'12px 6px', textAlign:'center', color: '#39FF14'}}>V</th></Tooltip>
                                <Tooltip content="Empates"><th style={{padding:'12px 6px', textAlign:'center', color: '#FFD700'}}>E</th></Tooltip>
                                <Tooltip content="Derrotas"><th style={{padding:'12px 6px', textAlign:'center', color: '#FF3333'}}>D</th></Tooltip>
                                <Tooltip content="Gols pró"><th style={{padding:'12px 6px', textAlign:'center'}}>GP</th></Tooltip>
                                <Tooltip content="Gols contra"><th style={{padding:'12px 6px', textAlign:'center'}}>GC</th></Tooltip>
                                <Tooltip content="Saldo de gols"><th style={{padding:'12px 6px', textAlign:'center'}}>SG</th></Tooltip>
                            </tr>
                        </thead>
                        <tbody>
                            {standings.map((s, i) => {
                                const t = engine.getTeam(s.teamId);
                                const pos = i + 1;
                                const zoneClass = getZoneClass(pos, standings.length, activeDiv);
                                const isUser = s.teamId === userTeam?.id;
                                const zoneBorderColor = getZoneBorderColor(zoneClass);
                                return (
                                    <tr key={s.teamId} style={{
                                        backgroundColor: isUser ? '#1A2A1A' : (i % 2 === 0 ? '#111417' : '#181A1F'),
                                        borderLeft: `4px solid ${zoneBorderColor}`,
                                        borderBottom: '2px solid #222'
                                    }}>
                                        <td style={{padding:'10px 6px', textAlign:'center', color: pos <= 4 ? '#FFD700' : '#888'}}>
                                            {pos}
                                        </td>
                                        <td style={{padding:'10px 6px', textAlign:'left'}}>
                                            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                                {t?.name && <EfClubBadge name={t.name} size="sm" />}
                                                <span style={{color: isUser ? '#FFD700' : '#FFF'}}>
                                                    {(t?.name || `TIME ${s.teamId}`).toUpperCase()}
                                                </span>
                                                {isUser && <span style={{color:'#39FF14',fontSize:'0.5rem'}}>◄</span>}
                                            </div>
                                        </td>
                                        <td style={{padding:'10px 6px', textAlign:'center', color: '#FFD700', fontWeight: 'bold'}}>{s.points}</td>
                                        <td style={{padding:'10px 6px', textAlign:'center'}}>{s.played}</td>
                                        <td style={{padding:'10px 6px', textAlign:'center', color: '#39FF14'}}>{s.won}</td>
                                        <td style={{padding:'10px 6px', textAlign:'center', color: '#FFD700'}}>{s.drawn}</td>
                                        <td style={{padding:'10px 6px', textAlign:'center', color: '#FF3333'}}>{s.lost}</td>
                                        <td style={{padding:'10px 6px', textAlign:'center'}}>{s.goalsFor}</td>
                                        <td style={{padding:'10px 6px', textAlign:'center'}}>{s.goalsAgainst}</td>
                                        <td style={{padding:'10px 6px', textAlign:'center', color: (s.goalsFor - s.goalsAgainst) >= 0 ? '#39FF14' : '#FF3333'}}>
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
