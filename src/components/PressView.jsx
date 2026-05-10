/**
 * PressView — SPEC-069 Press Conferences Hub
 *
 * Centraliza coletivas de imprensa pré + pós match.
 * Show 30+ question types via PressConference.generateQuestion().
 * 
 * 16-BIT BRUTALIST ARCADE AESTHETIC
 */

import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { generateQuestion, shouldTriggerPress } from '../engine/PressConference';
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

    if (!engine || !team) return <div style={{padding:'16px',color:'#FFF',fontFamily:"'Press Start 2P', monospace"}}>ERRO: JOGO NÃO INICIADO.</div>;
    if (!question) return <div style={{padding:'16px',color:'#FFF',fontFamily:"'Press Start 2P', monospace"}}>CARREGANDO COLETIVA...</div>;

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
            backgroundImage: `url(${bgPressConference})`,
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
                            COLETIVA DE IMPRENSA
                        </h2>
                        <span style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#888'}}>SALA DE CONFERÊNCIA</span>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>SAIR</EfButton>
                </div>

                {/* QUESTION CARD */}
                <div className="ef-anim-pop-in" style={{
                    background: '#1E2124',
                    border: '4px solid',
                    borderColor: '#4A5059 #111417 #111417 #4A5059',
                    padding: '24px',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
                }}>
                    {/* Context tag */}
                    <div style={{
                        display: 'inline-block',
                        background: '#3D280B',
                        border: '2px solid #F59E0B',
                        padding: '4px 12px',
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: '0.55rem',
                        color: '#FFD700',
                        marginBottom: '16px'
                    }}>
                        CONTEXTO: {question.context.toUpperCase()}
                    </div>

                    {/* Microphone icon + Question */}
                    <div style={{display: 'flex', gap: '16px', alignItems: 'flex-start'}}>
                        <div style={{
                            width: '48px', height: '48px', minWidth: '48px',
                            background: '#111', border: '4px solid #333',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.5rem'
                        }}>
                            🎙️
                        </div>
                        <p style={{
                            fontFamily: "'Press Start 2P', monospace",
                            fontSize: '0.7rem',
                            lineHeight: '1.8',
                            color: '#FFF',
                            margin: 0
                        }}>
                            "{question.text.toUpperCase()}"
                        </p>
                    </div>
                </div>

                {/* ANSWER OPTIONS */}
                {!answered ? (
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
                            SUA RESPOSTA:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {question.options.map((opt, idx) => (
                                <div
                                    key={opt.id}
                                    onClick={() => handleAnswer(opt)}
                                    style={{
                                        background: '#111',
                                        border: '4px solid',
                                        borderColor: '#333 #000 #000 #333',
                                        padding: '16px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        transition: 'border-color 0.1s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#FFD700 #AA8800 #AA8800 #FFD700'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#333 #000 #000 #333'}
                                >
                                    <span style={{
                                        fontFamily: "'Press Start 2P', monospace",
                                        fontSize: '0.8rem',
                                        color: '#FFD700',
                                        minWidth: '24px'
                                    }}>
                                        {String.fromCharCode(65 + idx)}.
                                    </span>
                                    <span style={{
                                        fontFamily: "'Press Start 2P', monospace",
                                        fontSize: '0.6rem',
                                        lineHeight: '1.6',
                                        color: '#FFF'
                                    }}>
                                        {opt.text.toUpperCase()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="ef-anim-slide-down" style={{
                        background: '#1E2124',
                        border: '4px solid',
                        borderColor: '#4A5059 #111417 #111417 #4A5059',
                        padding: '24px'
                    }}>
                        <div style={{
                            fontFamily: "'Press Start 2P', monospace",
                            fontSize: '0.7rem',
                            color: '#39FF14',
                            marginBottom: '16px',
                            textShadow: '2px 2px 0 #000'
                        }}>
                            ✓ RESPOSTA ENVIADA
                        </div>

                        <div style={{
                            background: '#111',
                            border: '4px solid',
                            borderColor: '#333 #000 #000 #333',
                            padding: '16px',
                            marginBottom: '16px'
                        }}>
                            <p style={{
                                fontFamily: "'Press Start 2P', monospace",
                                fontSize: '0.6rem',
                                lineHeight: '1.6',
                                color: '#FFF',
                                margin: 0
                            }}>
                                {answered.text.toUpperCase()}
                            </p>
                        </div>

                        {/* EFFECTS */}
                        <div style={{
                            background: '#0A1A0A',
                            border: '4px solid #39FF14',
                            padding: '12px',
                            marginBottom: '16px'
                        }}>
                            <span style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#39FF14'}}>EFEITOS: </span>
                            {Object.entries(answered.effect).map(([k, v]) => (
                                <span key={k} style={{
                                    fontFamily: "'Press Start 2P', monospace",
                                    fontSize: '0.6rem',
                                    marginRight: '16px',
                                    color: '#FFF'
                                }}>
                                    {k.toUpperCase()}: <strong style={{ color: v > 0 ? '#39FF14' : '#FF3333' }}>{v > 0 ? '+' : ''}{v}</strong>
                                </span>
                            ))}
                        </div>

                        <EfButton
                            variant="primary"
                            size="lg"
                            onClick={() => changeView(getDashboardView())}
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            VOLTAR AO DASHBOARD
                        </EfButton>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PressView;
