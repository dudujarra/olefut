/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { generateQuestion, shouldTriggerPress } from '../engine/PressConference';
import { EfPanel, EfButton } from './ui';
import bgPressConference from '../assets/environments/bg_press_conference.png';

import { 
    MicrophoneStage, Info, ArrowLeft, CheckCircle, ChartLineUp,
    Warning
} from '@phosphor-icons/react';

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

    if (!engine || !team) return (
        <div style={{ padding: '24px', color: colors.text, fontFamily: 'var(--font-mono)' }}>
            <Warning size={32} color={colors.danger} /> ERRO: JOGO NÃO INICIADO.
        </div>
    );
    if (!question) return (
        <div style={{ padding: '24px', color: colors.text, fontFamily: 'var(--font-mono)' }}>
            CARREGANDO COLETIVA...
        </div>
    );

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
                    borderBottom: `2px solid ${colors.secondary}`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', backgroundColor: colors.panelElevated, display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1px solid ${colors.border}` }}>
                            <MicrophoneStage size={28} color={colors.secondary} />
                        </div>
                        <div>
                            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontFamily: 'var(--font-sans)', color: colors.text, fontWeight: 'bold' }}>
                                COLETIVA DE IMPRENSA
                            </h2>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: colors.textMuted }}>
                                SALA DE CONFERÊNCIA — TREINADOR {engine?.manager?.name.toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>
                        <ArrowLeft size={16} /> SAIR
                    </EfButton>
                </EfPanel>

                {/* QUESTION CARD */}
                <EfPanel padding="lg" className="ef-anim-pop-in" style={{
                    borderLeft: `4px solid ${colors.warning}`
                }}>
                    {/* Context tag */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: colors.bg,
                        border: `1px solid ${colors.warning}`,
                        padding: '6px 12px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        color: colors.warning,
                        marginBottom: '20px',
                        fontWeight: 'bold'
                    }}>
                        <Info size={16} /> CONTEXTO: {question.context.toUpperCase()}
                    </div>

                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                        <div style={{
                            width: '40px', height: '40px', minWidth: '40px',
                            backgroundColor: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: `1px solid ${colors.border}`, color: colors.textMuted
                        }}>
                            <MicrophoneStage size={20} />
                        </div>
                        <p style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '1.1rem',
                            lineHeight: '1.6',
                            color: colors.text,
                            margin: 0,
                            fontWeight: '500',
                            fontStyle: 'italic'
                        }}>
                            "{question.text}"
                        </p>
                    </div>
                </EfPanel>

                {/* ANSWER OPTIONS */}
                {!answered ? (
                    <EfPanel padding="lg">
                        <div style={{
                            fontFamily: 'var(--font-mono)',
                            color: colors.textMuted,
                            fontSize: '0.9rem',
                            marginBottom: '20px',
                            fontWeight: 'bold',
                            borderBottom: `1px solid ${colors.border}`,
                            paddingBottom: '8px'
                        }}>
                            SUA RESPOSTA:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {question.options.map((opt, idx) => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleAnswer(opt)}
                                    style={{
                                        backgroundColor: colors.panelElevated,
                                        border: `1px solid ${colors.border}`,
                                        padding: '16px 20px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '20px',
                                        transition: 'all 0.2s ease',
                                        textAlign: 'left'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = colors.secondary;
                                        e.currentTarget.style.backgroundColor = colors.panelBg;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = colors.border;
                                        e.currentTarget.style.backgroundColor = colors.panelElevated;
                                    }}
                                >
                                    <span style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '1.2rem',
                                        color: colors.secondary,
                                        minWidth: '24px',
                                        fontWeight: 'bold'
                                    }}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span style={{
                                        fontFamily: 'var(--font-sans)',
                                        fontSize: '1rem',
                                        lineHeight: '1.5',
                                        color: colors.text,
                                        fontWeight: '500'
                                    }}>
                                        {opt.text}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </EfPanel>
                ) : (
                    <EfPanel padding="lg" className="ef-anim-slide-down" style={{
                        borderLeft: `4px solid ${colors.accent}`
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '1.1rem',
                            color: colors.accent,
                            marginBottom: '20px',
                            fontWeight: 'bold'
                        }}>
                            <CheckCircle size={24} weight="fill" /> RESPOSTA ENVIADA
                        </div>

                        <div style={{
                            backgroundColor: colors.panelElevated,
                            border: `1px solid ${colors.border}`,
                            padding: '20px',
                            marginBottom: '24px'
                        }}>
                            <p style={{
                                fontFamily: 'var(--font-sans)',
                                fontSize: '1rem',
                                lineHeight: '1.6',
                                color: colors.text,
                                margin: 0
                            }}>
                                "{answered.text}"
                            </p>
                        </div>

                        {/* EFFECTS */}
                        <div style={{
                            backgroundColor: colors.bg,
                            border: `1px solid ${colors.accent}`,
                            padding: '16px',
                            marginBottom: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: colors.textMuted, fontWeight: 'bold' }}>
                                <ChartLineUp size={16} /> REPERCUSSÃO (EFEITOS):
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                {Object.entries(answered.effect).map(([k, v]) => (
                                    <div key={k} style={{
                                        backgroundColor: colors.panelElevated,
                                        padding: '8px 12px',
                                        fontFamily: 'var(--font-sans)',
                                        fontSize: '0.9rem',
                                        color: colors.text,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        border: `1px solid ${colors.border}`
                                    }}>
                                        <span style={{ color: colors.textMuted, textTransform: 'uppercase' }}>{k}</span>
                                        <strong style={{ color: v > 0 ? colors.accent : colors.danger }}>{v > 0 ? '+' : ''}{v}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <EfButton
                            variant="primary"
                            size="lg"
                            onClick={() => changeView(getDashboardView())}
                            style={{ width: '100%', justifyContent: 'center', padding: '16px' }}
                        >
                            VOLTAR AO DASHBOARD
                        </EfButton>
                    </EfPanel>
                )}
            </div>
        </div>
    );
}

export default PressView;
