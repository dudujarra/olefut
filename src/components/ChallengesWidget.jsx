/**
 * ChallengesWidget — SPEC-103
 *
 * Dashboard widget mostrando 3 desafios ativos da semana.
 */

import React from 'react';
import { useGame } from '../context/GameContext';
import { getActiveChallenges, claimChallenge } from '../services/ChallengesService';

export function ChallengesWidget() {
    const { getEngine, forceUpdate } = useGame();
    const engine = getEngine();
    if (!engine) return null;

    const challenges = getActiveChallenges(engine);
    if (!challenges || challenges.length === 0) return null;

    const handleClaim = (id) => {
        const result = claimChallenge(engine, id);
        if (result.success) {
            forceUpdate();
        }
    };

    return (
        <div className="card" style={{ padding: '0.75rem', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ⚡ Desafios da Semana
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                    (opcional)
                </span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {challenges.map(c => (
                    <div key={c.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.4rem 0.5rem',
                        background: c.completed ? 'rgba(106,188,58,0.15)' : 'rgba(58,125,206,0.08)',
                        borderRadius: '4px',
                        border: `1px solid ${c.completed ? '#6ABC3A' : '#2a3530'}`
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                                {c.completed ? '✅ ' : c.progress >= 100 ? '🎉 ' : '⏳ '}{c.title}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                {c.desc}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--accent)' }}>
                                +{c.reward.prestige}P · R${(c.reward.money / 1000).toFixed(0)}k
                            </div>
                            {c.progress >= 100 && !c.completed && (
                                <button
                                    onClick={() => handleClaim(c.id)}
                                    style={{
                                        marginTop: '2px',
                                        fontSize: '0.65rem',
                                        background: '#FFD700',
                                        color: '#0F1A14',
                                        border: 'none',
                                        borderRadius: '3px',
                                        padding: '2px 8px',
                                        cursor: 'pointer',
                                        fontWeight: 700
                                    }}
                                >RESGATAR</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ChallengesWidget;
