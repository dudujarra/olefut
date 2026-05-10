/**
 * RivalriesView — v2.0 (AKITA-142)
 *
 * Tabela de rivalidades usando engine.rivalryHistory (SPEC-080).
 * Mostra H2H real, score de rivalidade, e arcos nomeados do RivalryUpgradeSystem.
 * 
 * 16-BIT BRUTALIST ARCADE AESTHETIC
 */

import React from 'react';
import { useGame } from '../context/GameContext';
import { EfButton } from './ui/EfButton';
import { EfClubBadge } from './ui/EfClubBadge';
import bgNewspaper from '../assets/environments/bg_newspaper.png';

function getRivalryLabel(matchCount) {
    if (matchCount >= 10) return { label: 'CONSOLIDADA', color: '#FF3333', icon: '🔴' };
    if (matchCount >= 6) return { label: 'NOVO CLÁSSICO', color: '#FFD700', icon: '🟡' };
    if (matchCount >= 3) return { label: 'CRESCENDO', color: '#FF8C00', icon: '🟠' };
    return { label: 'INÍCIO', color: '#888', icon: '⚪' };
}

function getRivalryBorderColor(matchCount) {
    if (matchCount >= 10) return '#FF3333';
    if (matchCount >= 6) return '#FFD700';
    if (matchCount >= 3) return '#FF8C00';
    return '#333';
}

export function RivalriesView() {
    const { getEngine, changeView, getDashboardView } = useGame();
    const engine = getEngine();

    if (!engine) return <div style={{padding:'16px',color:'#FFF',fontFamily:"'Press Start 2P', monospace"}}>ENGINE NÃO INICIALIZADO.</div>;

    const team = engine.getTeam(engine.manager?.teamId);
    const rivalryHistory = engine.rivalryHistory || {};

    // Build rivalry list from engine.rivalryHistory (SPEC-080 real data)
    const rivalries = Object.keys(rivalryHistory)
        .map(key => {
            const [aIdStr, bIdStr] = key.split('_');
            const aId = parseInt(aIdStr);
            const bId = parseInt(bIdStr);
            // Only show rivalries involving the player's team
            if (team && aId !== team.id && bId !== team.id) return null;
            const clubA = engine.getTeam(aId);
            const clubB = engine.getTeam(bId);
            const matches = rivalryHistory[key] || [];
            const isA = team && team.id === aId;
            const wins = matches.filter(m => isA ? m.clubAScore > m.clubBScore : m.clubBScore > m.clubAScore).length;
            const losses = matches.filter(m => isA ? m.clubAScore < m.clubBScore : m.clubBScore < m.clubAScore).length;
            const draws = matches.length - wins - losses;
            return {
                key,
                clubA,
                clubB,
                matches: matches.length,
                wins,
                draws,
                losses,
                isA,
            };
        })
        .filter(Boolean)
        .filter(r => r.clubA && r.clubB && r.matches > 0)
        .sort((x, y) => y.matches - x.matches);

    return (
        <div className="ef-anim-fade-in" style={{
            backgroundImage: `url(${bgNewspaper})`,
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
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

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
                    <div>
                        <h2 style={{fontFamily: "'Press Start 2P', monospace", color: '#FFD700', margin: '0 0 8px 0', fontSize: '1rem', textShadow: '3px 3px 0 #000'}}>
                            RIVALIDADES
                        </h2>
                        <span style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#888'}}>CONFRONTOS HISTÓRICOS</span>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>SAIR</EfButton>
                </div>

                {/* RIVALRIES LIST */}
                <div style={{
                    background: '#1E2124',
                    border: '4px solid',
                    borderColor: '#4A5059 #111417 #111417 #4A5059',
                    padding: '16px',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
                }}>
                    <div style={{
                        background: '#111',
                        padding: '8px',
                        borderBottom: '2px solid #333',
                        marginBottom: '16px',
                        fontFamily: "'Press Start 2P', monospace",
                        color: '#FFD700',
                        fontSize: '0.65rem',
                        textShadow: '2px 2px 0 #000'
                    }}>
                        CONFRONTOS DIRETOS ({rivalries.length})
                    </div>

                    {rivalries.length === 0 ? (
                        <div style={{
                            background: '#111',
                            padding: '32px',
                            textAlign: 'center',
                            border: '4px dashed #333',
                            fontFamily: "'Press Start 2P', monospace",
                            fontSize: '0.6rem',
                            color: '#888'
                        }}>
                            NENHUMA RIVALIDADE DETECTADA. JOGUE MAIS PARTIDAS.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {rivalries.map(r => {
                                const label = getRivalryLabel(r.matches);
                                const oppTeam = r.isA ? r.clubB : r.clubA;
                                const borderColor = getRivalryBorderColor(r.matches);
                                return (
                                    <div key={r.key} style={{
                                        background: '#111',
                                        border: '4px solid',
                                        borderColor: '#333 #000 #000 #333',
                                        borderLeftColor: borderColor,
                                        borderLeftWidth: '6px',
                                        padding: '16px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                                            {oppTeam?.name && <EfClubBadge name={oppTeam.name} size="sm" />}
                                            <div>
                                                <div style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.75rem', color: '#FFF', marginBottom: '8px'}}>
                                                    VS {(oppTeam?.name || '???').toUpperCase()}
                                                </div>
                                                <div style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#888'}}>
                                                    {r.matches} JOGOS •{' '}
                                                    <span style={{color: '#39FF14'}}>{r.wins}V</span>{' '}
                                                    <span style={{color: '#FFD700'}}>{r.draws}E</span>{' '}
                                                    <span style={{color: '#FF3333'}}>{r.losses}D</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{
                                            background: borderColor === '#333' ? '#222' : 'rgba(0,0,0,0.5)',
                                            border: `2px solid ${borderColor}`,
                                            padding: '4px 12px',
                                            fontFamily: "'Press Start 2P', monospace",
                                            fontSize: '0.5rem',
                                            color: label.color
                                        }}>
                                            {label.icon} {label.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Former Companions (SPEC-081) */}
                {(engine.formerCompanions?.length || 0) > 0 && (
                    <div style={{
                        background: '#1E2124',
                        border: '4px solid',
                        borderColor: '#4A5059 #111417 #111417 #4A5059',
                        padding: '16px'
                    }}>
                        <div style={{
                            background: '#111',
                            padding: '8px',
                            borderBottom: '2px solid #333',
                            marginBottom: '16px',
                            fontFamily: "'Press Start 2P', monospace",
                            color: '#FFD700',
                            fontSize: '0.65rem',
                            textShadow: '2px 2px 0 #000'
                        }}>
                            EX-COMPANHEIROS ({engine.formerCompanions.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {engine.formerCompanions.map((p, i) => (
                                <div key={i} style={{
                                    background: '#111',
                                    border: '4px solid',
                                    borderColor: '#333 #000 #000 #333',
                                    padding: '12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.7rem', color: '#FFF'}}>
                                        {p.name.toUpperCase()}
                                        <span style={{color: '#888', marginLeft: '8px', fontSize: '0.55rem'}}>({p.position})</span>
                                    </div>
                                    <div style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#888'}}>
                                        OVR {p.ovr} • TEMP {p.season || '?'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RivalriesView;
