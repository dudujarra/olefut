import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { generateQuestion, shouldTriggerPress } from '../engine/PressConference';
import { EfPanel, EfButton } from './ui';
import bgPressConference from '../assets/environments/bg_press_conference.png';
import '../styles/press-view.css';

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
        <div className="ef-mono ef-text-main ef-press__error">
            <Warning size={32} className="ef-text-danger" /> ERRO: JOGO NÃO INICIADO.
        </div>
    );
    if (!question) return (
        <div className="ef-mono ef-text-main ef-press__error">
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
            className="ef-anim-fade-in ef-sans ef-text-main ef-press ef-press__root"
            style={{ backgroundImage: `url(${bgPressConference})` }}
        >
            <div className="ef-view-container ef-view-container--narrow">

                {/* HEADER */}
                <EfPanel padding="lg" className="ef-press__header">
                    <div className="ef-press__header-identity">
                        <div className="ef-press__header-icon-box">
                            <MicrophoneStage size={28} className="ef-text-info" />
                        </div>
                        <div>
                            <h2 className="ef-sans ef-text-main ef-press__header-title">
                                COLETIVA DE IMPRENSA
                            </h2>
                            <span className="ef-mono ef-text-muted ef-press__header-subtitle">
                                SALA DE CONFERÊNCIA — TREINADOR {engine?.manager?.name.toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>
                        <ArrowLeft size={16} /> SAIR
                    </EfButton>
                </EfPanel>

                {/* QUESTION CARD */}
                <EfPanel padding="lg" className="ef-anim-pop-in ef-press__question-card">
                    {/* Context tag */}
                    <div className="ef-mono ef-text-accent ef-press__context-tag">
                        <Info size={16} /> CONTEXTO: {question.context.toUpperCase()}
                    </div>

                    <div className="ef-press__question-row">
                        <div className="ef-text-muted ef-press__question-mic-box">
                            <MicrophoneStage size={20} />
                        </div>
                        <p className="ef-sans ef-text-main ef-press__question-text">
                            "{question.text}"
                        </p>
                    </div>
                </EfPanel>

                {/* ANSWER OPTIONS */}
                {!answered ? (
                    <EfPanel padding="lg">
                        <div className="ef-mono ef-text-muted ef-press__answer-label">
                            SUA RESPOSTA:
                        </div>
                        <div className="ef-press__answer-list">
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
                    <EfPanel padding="lg" className="ef-anim-slide-down ef-press__answered-panel">
                        <div className="ef-sans ef-text-primary ef-press__answered-header">
                            <CheckCircle size={24} weight="fill" /> RESPOSTA ENVIADA
                        </div>

                        <div className="ef-press__answered-quote">
                            <p className="ef-sans ef-text-main ef-press__answered-quote-text">
                                "{answered.text}"
                            </p>
                        </div>

                        {/* EFFECTS */}
                        <div className="ef-press__effects">
                            <div className="ef-mono ef-text-muted ef-press__effects-header">
                                <ChartLineUp size={16} /> REPERCUSSÃO (EFEITOS):
                            </div>
                            <div className="ef-press__effects-list">
                                {Object.entries(answered.effect).map(([k, v]) => (
                                    <div key={k} className="ef-sans ef-text-main ef-press__effect-chip">
                                        <span className="ef-text-muted ef-press__effect-key">{k}</span>
                                        <strong className={v > 0 ? 'ef-text-primary' : 'ef-text-danger'}>{v > 0 ? '+' : ''}{v}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <EfButton
                            variant="primary"
                            size="lg"
                            onClick={() => changeView(getDashboardView())}
                            className="ef-press__dashboard-button"
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
