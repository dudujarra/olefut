/**
 * RivalriesView — v2.0 (AKITA-142)
 *
 * Tabela de rivalidades usando engine.rivalryHistory (SPEC-080).
 * Mostra H2H real, score de rivalidade, e arcos nomeados do RivalryUpgradeSystem.
 */

import React from 'react';
import { useGame } from '../context/GameContext';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';
import bgNewspaper from '../assets/environments/bg_newspaper.png';

function getRivalryLabel(matchCount) {
    if (matchCount >= 10) return { label: '🔴 Consolidada', color: 'var(--danger)' };
    if (matchCount >= 6) return { label: '🟡 Novo Clássico', color: 'var(--accent)' };
    if (matchCount >= 3) return { label: '🟠 Crescendo', color: 'orange' };
    return { label: '⚪ Início', color: 'var(--text-muted)' };
}

export function RivalriesView() {
    const { getEngine, changeView, getDashboardView } = useGame();
    const engine = getEngine();

    if (!engine) return <div style={{padding:'16px',color:'var(--text-main)'}}>Engine não inicializado.</div>;

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
            color: 'var(--ef-color-neutral-text-hi)'
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <EfPanel variant="elev" padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>⚔️ RIVALIDADES</h2>
                    <EfButton variant="secondary" size="sm" onClick={() => changeView(getDashboardView())}>← VOLTAR</EfButton>
                </EfPanel>

                <EfPanel variant="elev" padding="md">
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem' }}>
                        Confrontos Diretos ({rivalries.length})
                    </h3>
                    {rivalries.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Nenhuma rivalidade detectada. Jogue mais partidas para construir histórico.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {rivalries.map(r => {
                                const label = getRivalryLabel(r.matches);
                                const oppTeam = r.isA ? r.clubB : r.clubA;
                                return (
                                    <EfPanel key={r.key} variant="sunk" padding="sm" style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '0.85rem'
                                    }}>
                                        <div>
                                            <strong style={{ color: 'var(--text-main)', fontSize: '1rem' }}>vs {oppTeam?.name || '???'}</strong>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                {r.matches} jogos • <span style={{ color: 'var(--primary)' }}>{r.wins}V</span> <span style={{ color: 'var(--accent)' }}>{r.draws}E</span> <span style={{ color: 'var(--danger)' }}>{r.losses}D</span>
                                            </div>
                                        </div>
                                        <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 'bold' }}>
                                            <span style={{ fontSize: '0.8rem', color: label.color }}>{label.label}</span>
                                        </span>
                                    </EfPanel>
                                );
                            })}
                        </div>
                    )}
                </EfPanel>

                {/* Former Companions (SPEC-081) */}
                {(engine.formerCompanions?.length || 0) > 0 && (
                    <EfPanel variant="elev" padding="md">
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem' }}>
                            👥 Ex-Companheiros ({engine.formerCompanions.length})
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {engine.formerCompanions.map((p, i) => (
                                <EfPanel key={i} variant="sunk" padding="sm" style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '0.85rem'
                                }}>
                                    <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{p.name} <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>({p.position})</span></span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>OVR {p.ovr} • Vendido temp {p.season || '?'}</span>
                                </EfPanel>
                            ))}
                        </div>
                    </EfPanel>
                )}
            </div>
        </div>
    );
}

export default RivalriesView;
