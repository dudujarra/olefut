/* eslint-disable no-unused-vars */
import React from 'react';
import { useGame } from '../context/GameContext';
import { EfButton, EfPanel, EfClubBadge } from './ui';
import bgNewspaper from '../assets/environments/bg_newspaper.png';

import { 
    Fire, ArrowLeft, Users, Trophy, TrendUp, WarningCircle
} from '@phosphor-icons/react';

function getRivalryLabel(matchCount) {
    if (matchCount >= 10) return { label: 'CONSOLIDADA', color: '#FF3333', icon: <Fire weight="fill" /> };
    if (matchCount >= 6) return { label: 'NOVO CLÁSSICO', color: '#FFD700', icon: <TrendUp weight="bold" /> };
    if (matchCount >= 3) return { label: 'CRESCENDO', color: '#FF8C00', icon: <Trophy weight="bold" /> };
    return { label: 'INÍCIO', color: '#888', icon: <WarningCircle weight="bold" /> };
}

function getRivalryBorderColor(matchCount) {
    if (matchCount >= 10) return '#FF3333';
    if (matchCount >= 6) return '#FFD700';
    if (matchCount >= 3) return '#FF8C00';
    return '#2D3748'; // Default border color
}

export function RivalriesView() {
    const { getEngine, changeView, getDashboardView } = useGame();
    const engine = getEngine();

    const colors = {
        bg: '#0D1117',
        panelBg: '#161B22',
        panelElevated: '#1A1F24',
        border: '#2D3748',
        text: '#FDFBF7',
        textMuted: '#8E9E94',
        accent: '#39FF14',
        secondary: '#40BAF7',
        warning: '#FFD700',
        danger: '#FF3333'
    };

    if (!engine) return (
        <div style={{ padding: '24px', color: colors.text, fontFamily: 'var(--font-mono)' }}>
            ENGINE NÃO INICIALIZADO.
        </div>
    );

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
            backgroundColor: colors.bg,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            minHeight: '100dvh',
            padding: '24px',
            color: colors.text,
            fontFamily: 'var(--font-sans)',
            overflowY: 'auto'
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* HEADER */}
                <EfPanel padding="lg" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderBottom: `2px solid ${colors.warning}`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', backgroundColor: colors.panelElevated, display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1px solid ${colors.border}` }}>
                            <Fire size={28} color={colors.warning} weight="fill" />
                        </div>
                        <div>
                            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontFamily: 'var(--font-sans)', color: colors.text, fontWeight: 'bold' }}>
                                RIVALIDADES
                            </h2>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: colors.textMuted }}>
                                CONFRONTOS HISTÓRICOS E CLÁSSICOS
                            </span>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>
                        <ArrowLeft size={16} /> SAIR
                    </EfButton>
                </EfPanel>

                {/* RIVALRIES LIST */}
                <EfPanel padding="lg">
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontFamily: 'var(--font-mono)',
                        color: colors.warning,
                        fontSize: '0.9rem',
                        marginBottom: '20px',
                        fontWeight: 'bold',
                        borderBottom: `1px solid ${colors.border}`,
                        paddingBottom: '8px'
                    }}>
                        <Users size={20} /> CONFRONTOS DIRETOS ({rivalries.length})
                    </div>

                    {rivalries.length === 0 ? (
                        <div style={{
                            backgroundColor: colors.panelElevated,
                            padding: '32px',
                            textAlign: 'center',
                            border: `1px dashed ${colors.border}`,
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.9rem',
                            color: colors.textMuted
                        }}>
                            NENHUMA RIVALIDADE DETECTADA. JOGUE MAIS PARTIDAS.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {rivalries.map(r => {
                                const label = getRivalryLabel(r.matches);
                                const oppTeam = r.isA ? r.clubB : r.clubA;
                                const borderColor = getRivalryBorderColor(r.matches);
                                return (
                                    <div key={r.key} style={{
                                        backgroundColor: colors.panelElevated,
                                        border: `1px solid ${colors.border}`,
                                        borderLeftColor: borderColor,
                                        borderLeftWidth: '6px',
                                        padding: '16px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
                                            {oppTeam?.name ? (
                                                <EfClubBadge name={oppTeam.name} size="md" />
                                            ) : (
                                                <div style={{ width: '48px', height: '48px', backgroundColor: colors.bg, }} />
                                            )}
                                            <div>
                                                <div style={{fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '1.1rem', color: colors.text, marginBottom: '4px'}}>
                                                    VS {(oppTeam?.name || '???')}
                                                </div>
                                                <div style={{fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '8px'}}>
                                                    <span>{r.matches} JOGOS</span> •{' '}
                                                    <span style={{color: colors.accent, fontWeight: 'bold'}}>{r.wins}V</span>{' '}
                                                    <span style={{color: colors.warning, fontWeight: 'bold'}}>{r.draws}E</span>{' '}
                                                    <span style={{color: colors.danger, fontWeight: 'bold'}}>{r.losses}D</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{
                                            backgroundColor: colors.bg,
                                            border: `1px solid ${borderColor}`,
                                            padding: '6px 12px',
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            color: label.color,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            {label.icon} {label.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </EfPanel>

                {/* Former Companions (SPEC-081) */}
                {(engine.formerCompanions?.length || 0) > 0 && (
                    <EfPanel padding="lg">
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontFamily: 'var(--font-mono)',
                            color: colors.secondary,
                            fontSize: '0.9rem',
                            marginBottom: '20px',
                            fontWeight: 'bold',
                            borderBottom: `1px solid ${colors.border}`,
                            paddingBottom: '8px'
                        }}>
                            <Users size={20} /> EX-COMPANHEIROS ({engine.formerCompanions.length})
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                            {engine.formerCompanions.map((p, i) => (
                                <div key={i} style={{
                                    backgroundColor: colors.panelElevated,
                                    border: `1px solid ${colors.border}`,
                                    padding: '16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '1rem', color: colors.text}}>
                                        {p.name}
                                        <span style={{color: colors.secondary, marginLeft: '8px', fontSize: '0.85rem', fontFamily: 'var(--font-mono)'}}>({p.position})</span>
                                    </div>
                                    <div style={{
                                        backgroundColor: colors.bg,
                                        padding: '4px 8px',
                                        border: `1px solid ${colors.border}`,
                                        fontFamily: 'var(--font-mono)', 
                                        fontSize: '0.8rem', 
                                        color: colors.textMuted
                                    }}>
                                        OVR {p.ovr} • TEMP {p.season || '?'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </EfPanel>
                )}
            </div>
        </div>
    );
}

export default RivalriesView;
