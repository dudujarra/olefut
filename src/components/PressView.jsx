/**
 * PressView — SPEC-069 Press Conferences Hub
 *
 * Centraliza coletivas de imprensa pré + pós match.
 * Show 30+ question types via PressConference.generateQuestion().
 */

import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { generateQuestion, shouldTriggerPress } from '../engine/PressConference';

export function PressView() {
    const { changeView, getEngine, forceUpdate, getDashboardView } = useGame();
    const engine = getEngine();
    const team = engine?.getTeam(engine?.manager?.teamId);

    const [question, setQuestion] = useState(null);
    const [answered, setAnswered] = useState(null);

    useEffect(() => {
        if (!engine || !team) return;
        const standings = engine.getStandings(team.zone, team.division);
        const pos = standings.findIndex(s => s.teamId === team.id) + 1;
        const total = standings.length;
        const streak = engine.managerStats?.streak || 0;
        const avgMorale = team.squad.reduce((s, p) => s + (p.moral || 50), 0) / team.squad.length;
        const q = generateQuestion(streak, pos, total, avgMorale);
        setQuestion(q);
    }, []);

    if (!engine || !team) return <div className="main-content">Erro: jogo não iniciado.</div>;
    if (!question) return <div className="main-content">Carregando coletiva...</div>;

    const handleAnswer = (option) => {
        // Apply effects
        if (option.effect.moral) {
            team.squad.forEach(p => {
                p.moral = Math.max(0, Math.min(100, (p.moral || 50) + option.effect.moral));
            });
        }
        if (option.effect.boardConfidence && engine.board) {
            engine.board.confidence = Math.max(0, Math.min(100, engine.board.confidence + option.effect.boardConfidence));
        }
        setAnswered(option);
        forceUpdate();
    };

    return (
        <div className="main-content fade-in ef-art-bg ef-art-press-box">
            <div className="card-header" style={{ marginBottom: '1rem' }}>
                <h2>🎙️ Coletiva de Imprensa</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => changeView(getDashboardView())}>← Voltar</button>
            </div>

            <div className="card ef-anim-pop-in" style={{ padding: '1rem', marginBottom: '1rem' }}>
                <div style={{
                    fontSize: '0.85rem',
                    color: 'var(--accent)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.5rem'
                }}>
                    Contexto: {question.context}
                </div>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>
                    {question.text}
                </p>
            </div>

            {!answered ? (
                <div className="card" style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Sua resposta:</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {question.options.map(opt => (
                            <button
                                key={opt.id}
                                className="btn btn-secondary"
                                onClick={() => handleAnswer(opt)}
                                style={{
                                    textAlign: 'left',
                                    padding: '0.75rem',
                                    fontSize: '0.85rem',
                                    lineHeight: '1.3'
                                }}
                            >
                                {opt.text}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="card ef-anim-slide-down" style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>✓ Resposta enviada</h3>
                    <p style={{ margin: '0.5rem 0', fontSize: '0.85rem' }}>{answered.text}</p>
                    <div style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        padding: '0.5rem',
                        background: 'rgba(106,188,58,0.1)',
                        borderRadius: '4px',
                        marginTop: '0.5rem'
                    }}>
                        Efeitos: {Object.entries(answered.effect).map(([k, v]) => (
                            <span key={k} style={{ marginRight: '8px' }}>
                                {k}: <strong style={{ color: v > 0 ? 'var(--primary)' : 'var(--danger)' }}>{v > 0 ? '+' : ''}{v}</strong>
                            </span>
                        ))}
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => changeView(getDashboardView())}
                        style={{ marginTop: '1rem', width: '100%' }}
                    >
                        ← Voltar ao Dashboard
                    </button>
                </div>
            )}
        </div>
    );
}

export default PressView;
