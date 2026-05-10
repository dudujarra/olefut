/**
 * PressView — SPEC-069 Press Conferences Hub
 *
 * Centraliza coletivas de imprensa pré + pós match.
 * Show 30+ question types via PressConference.generateQuestion().
 */

import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { generateQuestion, shouldTriggerPress } from '../engine/PressConference';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';
import bgPressConference from '../assets/environments/bg_press_conference.png';

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

    if (!engine || !team) return <div style={{padding:'16px',color:'var(--text-main)'}}>Erro: jogo não iniciado.</div>;
    if (!question) return <div style={{padding:'16px',color:'var(--text-main)'}}>Carregando coletiva...</div>;

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
        <div className="ef-anim-fade-in" style={{
            backgroundImage: `linear-gradient(to bottom, rgba(11, 15, 25, 0.85), rgba(11, 15, 25, 0.95)), url(${bgPressConference})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            minHeight: '100dvh',
            padding: '16px',
            color: 'var(--ef-color-neutral-text-hi)'
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <EfPanel variant="elev" padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>🎙️ COLETIVA DE IMPRENSA</h2>
                    <EfButton variant="secondary" size="sm" onClick={() => changeView(getDashboardView())}>← VOLTAR</EfButton>
                </EfPanel>

                <EfPanel variant="sunk" padding="md" className="ef-anim-pop-in">
                    <div style={{
                        fontSize: '0.85rem',
                        color: 'var(--accent)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.5rem'
                    }}>
                        CONTEXTO: {question.context}
                    </div>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>
                        "{question.text}"
                    </p>
                </EfPanel>

                {!answered ? (
                    <EfPanel variant="elev" padding="md">
                        <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>SUA RESPOSTA:</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {question.options.map(opt => (
                                <EfButton
                                    key={opt.id}
                                    variant="secondary"
                                    onClick={() => handleAnswer(opt)}
                                    style={{
                                        justifyContent: 'flex-start',
                                        textAlign: 'left',
                                        padding: '0.75rem',
                                        fontSize: '0.85rem',
                                        lineHeight: '1.3'
                                    }}
                                >
                                    {opt.text}
                                </EfButton>
                            ))}
                        </div>
                    </EfPanel>
                ) : (
                    <EfPanel variant="elev" padding="md" className="ef-anim-slide-down">
                        <h3 style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>✓ RESPOSTA ENVIADA</h3>
                        <p style={{ margin: '0.5rem 0', fontSize: '0.85rem' }}>{answered.text}</p>
                        <div style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-muted)',
                            padding: '0.5rem',
                            background: 'rgba(106,188,58,0.1)',
                            borderRadius: '4px',
                            marginTop: '0.5rem'
                        }}>
                            EFEITOS: {Object.entries(answered.effect).map(([k, v]) => (
                                <span key={k} style={{ marginRight: '8px' }}>
                                    {k}: <strong style={{ color: v > 0 ? 'var(--primary)' : 'var(--danger)' }}>{v > 0 ? '+' : ''}{v}</strong>
                                </span>
                            ))}
                        </div>
                        <EfButton
                            variant="primary"
                            onClick={() => changeView(getDashboardView())}
                            style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
                        >
                            ← VOLTAR AO DASHBOARD
                        </EfButton>
                    </EfPanel>
                )}
            </div>
        </div>
    );
}

export default PressView;
