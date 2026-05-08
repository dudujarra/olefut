/**
 * RivalriesView — v1.4 (AKITA-055)
 *
 * Tabela de rivalidades dinâmicas + arcos abertos.
 * Threshold visual: 50 "novo clássico", 80 "rivalidade consolidada".
 */

import React from 'react';
import { useGame } from '../context/GameContext';
import { useRelationships } from '../hooks/useRelationships';
import { useNarrative } from '../hooks/useNarrative';

function getRivalryLabel(value) {
    if (value >= 80) return { label: '🔴 Consolidada', color: 'var(--danger)' };
    if (value >= 50) return { label: '🟡 Novo Clássico', color: 'var(--accent)' };
    if (value >= 30) return { label: '🟠 Crescendo', color: 'orange' };
    return { label: '⚪ Baixa', color: 'var(--text-muted)' };
}

export function RivalriesView() {
    const { gameState, getEngine, changeView, getDashboardView } = useGame();
    const { getRivalry } = useRelationships();
    const { getOpenArcs } = useNarrative();
    const engine = getEngine();

    if (!engine) return <div className="main-content">Engine não inicializado.</div>;

    // Build rivalry list from engine.relations.club_club
    const clubClubMap = engine.relations?.club_club || {};
    const rivalries = Object.keys(clubClubMap)
        .map(key => {
            const [a, b] = key.split('_').map(Number);
            return {
                key,
                clubA: engine.getTeam(a),
                clubB: engine.getTeam(b),
                rivalry: clubClubMap[key].rivalry || 0
            };
        })
        .filter(r => r.clubA && r.clubB && r.rivalry > 0)
        .sort((x, y) => y.rivalry - x.rivalry);

    const openArcs = getOpenArcs();

    return (
        <div className="main-content fade-in ef-art-bg ef-art-crowd-strip">
            <div className="card-header" style={{ marginBottom: '1rem' }}>
                <h2>⚔️ Rivalidades</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => changeView(getDashboardView())}>← Voltar</button>
            </div>

            <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                    Tabela ({rivalries.length})
                </h3>
                {rivalries.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Nenhuma rivalidade detectada. Clássicos disputados aumentam tensão entre clubes.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {rivalries.map(r => {
                            const label = getRivalryLabel(r.rivalry);
                            return (
                                <div key={r.key} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.5rem 0.75rem',
                                    background: 'var(--bg-panel-solid)',
                                    borderRadius: 'var(--radius-xs)',
                                    fontSize: '0.85rem'
                                }}>
                                    <span>
                                        <strong>{r.clubA.name}</strong>
                                        <span style={{ color: 'var(--text-muted)', margin: '0 0.4rem' }}>vs</span>
                                        <strong>{r.clubB.name}</strong>
                                    </span>
                                    <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', color: label.color }}>{label.label}</span>
                                        <strong style={{ color: label.color, fontSize: '0.95rem' }}>
                                            {Math.round(r.rivalry)}
                                        </strong>
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {openArcs.length > 0 && (
                <div className="card" style={{ padding: '1rem' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                        📜 Arcos Narrativos Ativos ({openArcs.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {openArcs.map(arc => (
                            <div key={arc.id} style={{
                                padding: '0.5rem 0.75rem',
                                background: 'rgba(245, 158, 11, 0.08)',
                                borderLeft: '3px solid var(--accent)',
                                borderRadius: 'var(--radius-xs)'
                            }}>
                                <strong style={{ fontSize: '0.9rem' }}>{arc.name}</strong>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Atores: {arc.actors.join(', ')} · Aberto há {Math.round((Date.now() - arc.openedAt) / 1000 / 60 / 60 / 24)} dias
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default RivalriesView;
