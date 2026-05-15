/**
 * PressView — Coletiva de Imprensa (Stitch v1.1 port)
 *
 * Match reference: docs/stitch-designs/v1.1-all/81-coletiva-de-imprensa-ol-fut-pressview.html
 * Brand-locked: Press Start 2P (display) + Pixelify Sans (sans) + IBM Plex Mono (mono).
 *
 * AKITA-387 (port-only): zero changes to engine, hooks, business logic.
 * Preserves:
 *   - generateQuestion(streak, position, total, avgMorale) call signature
 *   - answered ternary (!answered ? options : answered_panel)
 *   - effect application (moral on all squad players, boardConfidence on engine.board)
 *   - useState initializer pattern (BUG-081 fix)
 *
 * Visual changes:
 *   - hero "manager press room" panel with bg_press_conference image + room tags
 *   - reporter speech bubble panel with REPORTER tag + newspaper icon
 *   - 2-col responsive grid of A/B/C/D answer options
 *   - answered confirmation panel with effects chips + back button
 */

import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { generateQuestion } from '../engine/PressConference';
import { EfPanel, EfButton } from './ui';
import '../styles/press-view.css';

import {
    MicrophoneStage, Info, ArrowLeft, CheckCircle, ChartLineUp,
    Warning, Newspaper
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
        const avgMorale = team.squad.reduce((s, p) => s + (p.moral || 50), 0) / (team.squad.length || 1);
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
        // Apply effects (logic unchanged)
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
        <div className="ef-anim-fade-in ef-sans ef-text-main ef-press ef-press__root">
            <div className="ef-view-container ef-view-container--narrow ef-press__container">

                {/* HEADER */}
                <EfPanel padding="lg" className="ef-press__header">
                    <div className="ef-press__header-identity">
                        <div className="ef-press__header-icon-box">
                            <MicrophoneStage size={28} className="ef-text-primary" />
                        </div>
                        <div>
                            <h2 className="ef-sans ef-text-primary ef-press__header-title">
                                COLETIVA DE IMPRENSA
                            </h2>
                            <span className="ef-mono ef-text-muted ef-press__header-subtitle">
                                SALA DE CONFERÊNCIA — TREINADOR {engine?.manager?.name?.toUpperCase?.()}
                            </span>
                        </div>
                    </div>
                    <div className="ef-press__live-row">
                        <span className="ef-press__live-pill" aria-label="Transmissão ao vivo">
                            <span className="ef-press__live-dot" />
                            <span className="ef-mono ef-press__live-label">LIVE</span>
                        </span>
                        <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>
                            <ArrowLeft size={16} /> SAIR
                        </EfButton>
                    </div>
                </EfPanel>

                {/* MANAGER PRESS ROOM VISUAL */}
                <section
                    className="ef-press__hero"
                    aria-label="Sala de coletiva de imprensa"
                >
                    <div className="ef-press__hero-overlay">
                        <div className="ef-press__hero-tags">
                            <span className="ef-press__hero-tag ef-press__hero-tag--room">ROOM 1-B</span>
                            <span className="ef-press__hero-tag ef-press__hero-tag--feed">WORLD FEED</span>
                        </div>
                    </div>
                </section>

                {/* REPORTER SPEECH BUBBLE */}
                <EfPanel padding="lg" className="ef-anim-pop-in ef-press__question-card">
                    <div className="ef-press__reporter-tag">REPORTER</div>

                    {/* Context tag */}
                    <div className="ef-mono ef-text-accent ef-press__context-tag">
                        <Info size={16} /> CONTEXTO: {question.context.toUpperCase()}
                    </div>

                    <div className="ef-press__question-row">
                        <div className="ef-text-muted ef-press__question-mic-box" aria-hidden="true">
                            <Newspaper size={22} />
                        </div>
                        <p className="ef-sans ef-text-main ef-press__question-text">
                            &ldquo;{question.text}&rdquo;
                        </p>
                    </div>
                </EfPanel>

                {/* INTERACTIVE RESPONSE OPTIONS */}
                {!answered ? (
                    <EfPanel padding="lg" className="ef-press__answer-panel">
                        <div className="ef-mono ef-text-muted ef-press__answer-label">
                            SUA RESPOSTA:
                        </div>
                        <div className="ef-press__answer-grid">
                            {question.options.map((opt, idx) => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleAnswer(opt)}
                                    className="ef-press-option ef-press__option"
                                    type="button"
                                >
                                    <span className="ef-press-option__letter ef-press__option-letter">
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span className="ef-press-option__text ef-press__option-text">
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
                                &ldquo;{answered.text}&rdquo;
                            </p>
                        </div>

                        {/* EFFECTS */}
                        <div className="ef-press__effects">
                            <div className="ef-mono ef-text-muted ef-press__effects-header">
                                <ChartLineUp size={16} /> REPERCUSSÃO (EFEITOS):
                            </div>
                            <div className="ef-press__effects-list">
                                {Object.entries(answered.effect).map(([k, v]) => {
                                    const isNum = typeof v === 'number';
                                    const positive = isNum && v > 0;
                                    return (
                                        <div key={k} className="ef-sans ef-text-main ef-press__effect-chip">
                                            <span className="ef-text-muted ef-press__effect-key">{k}</span>
                                            <strong className={positive ? 'ef-text-primary' : 'ef-text-danger'}>
                                                {isNum ? `${positive ? '+' : ''}${v}` : String(v)}
                                            </strong>
                                        </div>
                                    );
                                })}
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
