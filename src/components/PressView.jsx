import { useState } from 'react';
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

    const [answered, setAnswered] = useState(null);

    // BUG-081 fix: useState initializer ao invés de setState em useEffect com []
    const [question] = useState(() => {
        if (!engine || !team) return null;
        const standings = engine.getStandings(team.zone, team.division);
        const pos = standings.findIndex(s => s.teamId === team.id) + 1;
        const total = standings.length;
        const streak = engine.managerStats?.streak || 0;
        const avgMorale = team.squad.reduce((s, p) => s + (p.moral || 50), 0) / team.squad.length;
        return generateQuestion(streak, pos, total, avgMorale);
    });

    if (!engine || !team) return (
        <div className="ef-mono ef-text-main" style={{ padding: '24px' }}>
            <Warning size={32} className="ef-text-danger" /> ERRO: JOGO NÃO INICIADO.
        </div>
    );
    if (!question) return (
        <div className="ef-mono ef-text-main" style={{ padding: '24px' }}>
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
        <div
            className="ef-anim-fade-in ef-sans ef-text-main"
            style={{
                backgroundImage: `url(${bgPressConference})`,
                imageRendering: 'pixelated',
                WebkitImageRendering: 'pixelated',
                backgroundColor: 'var(--bg-dark, #0D1117)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                minHeight: '100dvh',
                padding: '24px',
                overflowY: 'auto'
            }}
        >
            <div className="ef-view-container ef-view-container--narrow">

                {/* HEADER */}
                <EfPanel padding="lg" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #40BAF7' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', backgroundColor: '#1A1F24', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #2D3748' }}>
                            <MicrophoneStage size={28} className="ef-text-info" />
                        </div>
                        <div>
                            <h2 className="ef-sans ef-text-main" style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                COLETIVA DE IMPRENSA
                            </h2>
                            <span className="ef-mono ef-text-muted" style={{ fontSize: '0.8rem' }}>
                                SALA DE CONFERÊNCIA — TREINADOR {engine?.manager?.name.toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>
                        <ArrowLeft size={16} /> SAIR
                    </EfButton>
                </EfPanel>

                {/* QUESTION CARD */}
                <EfPanel padding="lg" className="ef-anim-pop-in" style={{ borderLeft: '4px solid var(--accent, #FFD700)' }}>
                    {/* Context tag */}
                    <div className="ef-mono ef-text-accent" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'var(--bg-dark, #0D1117)',
                        border: '1px solid var(--accent, #FFD700)',
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        marginBottom: '20px',
                        fontWeight: 'bold'
                    }}>
                        <Info size={16} /> CONTEXTO: {question.context.toUpperCase()}
                    </div>

                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                        <div className="ef-text-muted" style={{
                            width: '40px', height: '40px', minWidth: '40px',
                            backgroundColor: 'var(--bg-dark, #0D1117)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid #2D3748'
                        }}>
                            <MicrophoneStage size={20} />
                        </div>
                        <p className="ef-sans ef-text-main" style={{
                            fontSize: '1.1rem',
                            lineHeight: '1.6',
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
                        <div className="ef-mono ef-text-muted" style={{
                            fontSize: '0.9rem',
                            marginBottom: '20px',
                            fontWeight: 'bold',
                            borderBottom: '1px solid #2D3748',
                            paddingBottom: '8px'
                        }}>
                            SUA RESPOSTA:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {question.options.map((opt, idx) => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleAnswer(opt)}
                                    className="ef-press-option"
                                >
                                    <span className="ef-press-option__letter">
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span className="ef-press-option__text">
                                        {opt.text}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </EfPanel>
                ) : (
                    <EfPanel padding="lg" className="ef-anim-slide-down" style={{ borderLeft: '4px solid var(--primary, #39FF14)' }}>
                        <div className="ef-sans ef-text-primary" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '1.1rem',
                            marginBottom: '20px',
                            fontWeight: 'bold'
                        }}>
                            <CheckCircle size={24} weight="fill" /> RESPOSTA ENVIADA
                        </div>

                        <div style={{
                            backgroundColor: '#1A1F24',
                            border: '1px solid #2D3748',
                            padding: '20px',
                            marginBottom: '24px'
                        }}>
                            <p className="ef-sans ef-text-main" style={{
                                fontSize: '1rem',
                                lineHeight: '1.6',
                                margin: 0
                            }}>
                                "{answered.text}"
                            </p>
                        </div>

                        {/* EFFECTS */}
                        <div style={{
                            backgroundColor: 'var(--bg-dark, #0D1117)',
                            border: '1px solid var(--primary, #39FF14)',
                            padding: '16px',
                            marginBottom: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            <div className="ef-mono ef-text-muted" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                <ChartLineUp size={16} /> REPERCUSSÃO (EFEITOS):
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                {Object.entries(answered.effect).map(([k, v]) => (
                                    <div key={k} className="ef-sans ef-text-main" style={{
                                        backgroundColor: '#1A1F24',
                                        padding: '8px 12px',
                                        fontSize: '0.9rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        border: '1px solid #2D3748'
                                    }}>
                                        <span className="ef-text-muted" style={{ textTransform: 'uppercase' }}>{k}</span>
                                        <strong className={v > 0 ? 'ef-text-primary' : 'ef-text-danger'}>{v > 0 ? '+' : ''}{v}</strong>
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
