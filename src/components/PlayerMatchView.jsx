import { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { drawCard, enrichCardWithAtmosphere } from '../engine/MatchEventsDeck';
import { BenchEventsDeck } from '../engine/BenchEventsDeck';
import { EfClubBadge, EfPanel, EfButton } from './ui';
import bgMatchStadium from '../assets/environments/bg_match_stadium.png';
import { rng as systemRng } from '../engine/rng.js';
import '../styles/player-match-view.css';

import {
    Clock, SoccerBall, Flag, UserMinus, TrendUp, WarningCircle, CheckCircle, Question
} from '@phosphor-icons/react';

export function PlayerMatchView() {
    const { getEngine, changeView, forceUpdate } = useGame();
    const engine = getEngine();
    const player = engine.proPlayer;
    const team = engine.getTeam(engine.manager.teamId);

    const [minute, setMinute] = useState(0);
    const [homeGoals, setHomeGoals] = useState(0);
    const [awayGoals, setAwayGoals] = useState(0);
    const [narration, setNarration] = useState([]);
    const [activeEvent, setActiveEvent] = useState(null);
    const [eventResult, setEventResult] = useState(null);
    const [matchFinished, setMatchFinished] = useState(false);
    const [opponent, setOpponent] = useState(null);
    const [isBenched, setIsBenched] = useState(false);
    const [goalBurstActive, setGoalBurstActive] = useState(false);
    const prevHomeGoalsRef = useRef(0);
    const timerRef = useRef(null);

    useEffect(() => {
        if (homeGoals > prevHomeGoalsRef.current) {
            setGoalBurstActive(true);
            const t = setTimeout(() => setGoalBurstActive(false), 1300);
            prevHomeGoalsRef.current = homeGoals;
            return () => clearTimeout(t);
        }
        prevHomeGoalsRef.current = homeGoals;
    }, [homeGoals]);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        player.checkBenchStatus();
        setIsBenched(player.isBenched);

        for (const t of engine.tournaments) {
            if (t.constructor.name === 'League' && t.fixtures[engine.currentWeek]) {
                const match = t.fixtures[engine.currentWeek].find(m => m.home === team.id || m.away === team.id);
                if (match) {
                    const oppId = match.home === team.id ? match.away : match.home;
                    setOpponent(engine.getTeam(oppId));
                    break;
                }
            }
        }

        return () => clearInterval(timerRef.current);
    }, []);
    /* eslint-enable react-hooks/set-state-in-effect */

    useEffect(() => {
        if (matchFinished || activeEvent) return;
        const speed = isBenched ? 100 : 500;
        timerRef.current = setInterval(() => {
            setMinute(prev => {
                const next = prev + 1;
                if (next > 90) {
                    clearInterval(timerRef.current);
                    setMatchFinished(true);
                    return 90;
                }

                if (systemRng() < 0.04) {
                    if (systemRng() > 0.5) {
                        setHomeGoals(g => g + 1);
                        setNarration(n => [...n, { minute: next, text: `GOOOL do ${team.name}!`, isGoal: true }]);
                    } else {
                        setAwayGoals(g => g + 1);
                        setNarration(n => [...n, { minute: next, text: `Gol do adversário.`, isGoal: true }]);
                    }
                }

                if (!isBenched && !activeEvent && next % 20 === 0 && next < 90 && systemRng() < 0.6) {
                    clearInterval(timerRef.current);
                    const card = drawCard(player.position);
                    if (card) {
                        const seed = next + (player.id || 0);
                        const enrichEvtType = (player.position === 'ATA' && systemRng() < 0.4) ? 'goal'
                            : (player.position === 'GOL' && systemRng() < 0.4) ? 'save'
                            : (player.position === 'DEF' && systemRng() < 0.3) ? 'card'
                            : null;
                        const enriched = enrichEvtType ? enrichCardWithAtmosphere(card, enrichEvtType, seed) : card;
                        setActiveEvent(enriched);
                    }
                }

                if (isBenched && next % 25 === 0 && systemRng() < 0.5) {
                    clearInterval(timerRef.current);
                    const card = BenchEventsDeck[Math.floor(systemRng() * BenchEventsDeck.length)];
                    setActiveEvent({ ...card, isBench: true });
                }

                return next;
            });
        }, speed);

        return () => clearInterval(timerRef.current);
    }, [matchFinished, activeEvent, isBenched]);

    const handleChoice = (option) => {
        if (activeEvent.isBench) {
            const eff = option.effect;
            if (eff.boss) player.relationships.boss = Math.max(0, Math.min(100, player.relationships.boss + eff.boss));
            if (eff.fans) player.relationships.fans = Math.max(0, Math.min(100, player.relationships.fans + eff.fans));
            if (eff.teammates) player.relationships.teammates = Math.max(0, Math.min(100, player.relationships.teammates + eff.teammates));
            if (eff.energy) player.energy = Math.max(0, Math.min(100, player.energy + eff.energy));
            setEventResult(option.resultText);
        } else {
            const energyFactor = Math.max(0.3, player.energy / 100);
            const finalPower = player.skills[option.skill] * energyFactor * systemRng();
            const defPower = option.difficulty * systemRng();
            const isSuccess = finalPower > defPower;

            player.energy = Math.max(0, player.energy - 3);

            if (isSuccess) {
                player.relationships.boss = Math.max(0, Math.min(100, player.relationships.boss + (option.bossSuccess || 0)));
                player.relationships.fans = Math.max(0, Math.min(100, player.relationships.fans + (option.fansSuccess || 0)));
                if (option.successType === 'goal') {
                    setHomeGoals(g => g + 1);
                    player.seasonGoals++;
                    player.renown++;
                }
                setEventResult(`SUCCESS|${option.successText}`);
            } else {
                player.relationships.boss = Math.max(0, Math.min(100, player.relationships.boss + (option.bossFailure || 0)));
                player.relationships.fans = Math.max(0, Math.min(100, player.relationships.fans + (option.fansFailure || 0)));
                if (option.failType === 'goal_conceded' || option.failType === 'penalty_given') {
                    setAwayGoals(g => g + 1);
                }
                setEventResult(`FAIL|${option.failText}`);
            }
        }

        setTimeout(() => {
            setActiveEvent(null);
            setEventResult(null);
            forceUpdate();
        }, 2000);
    };

    const handleEndMatch = () => {
        const won = homeGoals > awayGoals;
        player.playMatch(isBenched ? 0 : 90, 0, won);
        engine.advanceWeek();
        forceUpdate();
        changeView('player_dashboard');
    };

    const resultIsSuccess = eventResult ? eventResult.startsWith('SUCCESS|') : false;
    const resultText = eventResult ? eventResult.replace(/^(SUCCESS|FAIL)\|/, '') : '';

    return (
        <div className="ef-anim-fade-in ef-scene-shell ef-pmatch" style={{ backgroundImage: `url(${bgMatchStadium})` }}>
            <div className="ef-pmatch__container">
                {isBenched && (
                    <div className="ef-bench-banner">
                        <UserMinus size={24} weight="fill" /> VOCÊ ESTÁ NO BANCO — Observe e interaja com os eventos
                    </div>
                )}

                <EfPanel padding="lg" className={`ef-match-scoreboard ${goalBurstActive ? 'ef-anim-shake' : ''}`}>
                    {goalBurstActive && (
                        <div className="ef-anim-goal-burst ef-pmatch__burst" />
                    )}
                    <div className="ef-match-scoreboard__row">
                        <div className="ef-match-scoreboard__team">
                            {team?.name ? (
                                <EfClubBadge name={team.name} size="md" />
                            ) : (
                                <div className="ef-match-scoreboard__placeholder" />
                            )}
                            <span className="ef-match-scoreboard__name">{team?.name || 'Meu Time'}</span>
                        </div>

                        <div className={`ef-match-scoreboard__score ${goalBurstActive ? 'ef-anim-counter' : ''}`}>
                            {homeGoals} <span className="ef-match-scoreboard__dash">-</span> {awayGoals}
                        </div>

                        <div className="ef-match-scoreboard__team">
                            {opponent?.name ? (
                                <EfClubBadge name={opponent.name} size="md" />
                            ) : (
                                <div className="ef-match-scoreboard__placeholder" />
                            )}
                            <span className="ef-match-scoreboard__name">{opponent?.name || 'Adversário'}</span>
                        </div>
                    </div>

                    <div className="ef-match-clock">
                        <div className="ef-match-clock__time">
                            <Clock size={24} weight="bold" /> {matchFinished ? 'FIM DE JOGO' : `${minute}'`}
                        </div>
                        <div className="ef-match-clock__track">
                            <div className="ef-match-clock__fill" style={{ width: `${(minute / 90) * 100}%` }} />
                        </div>
                    </div>
                </EfPanel>

                {activeEvent && !eventResult && (
                    <div className="ef-match-overlay">
                        <EfPanel padding="lg" className={activeEvent.isBench ? 'ef-pmatch__event-panel--bench' : 'ef-pmatch__event-panel--match'}>
                            <div className={`ef-match-event-header ${activeEvent.isBench ? 'ef-pmatch__event-header--bench' : 'ef-pmatch__event-header--match'}`}>
                                {activeEvent.isBench ? <Question size={32} /> : <WarningCircle size={32} weight="fill" />}
                                <h3 className="ef-match-event-title">
                                    {activeEvent.isBench ? 'DECISÃO NO BANCO' : `MOMENTO DECISIVO — ${minute}'`}
                                </h3>
                            </div>

                            <p className="ef-match-event-text">
                                {activeEvent.text}
                            </p>

                            <div className="ef-pmatch__options-list">
                                {activeEvent.options.map((opt, i) => (
                                    <EfButton key={i} variant="secondary" onClick={() => handleChoice(opt)} className="ef-pmatch__option-btn">
                                        <span>{opt.label}</span>
                                        {opt.skill && <span className="ef-mono ef-pmatch__option-skill">[{opt.skill.toUpperCase()}]</span>}
                                    </EfButton>
                                ))}
                            </div>
                        </EfPanel>
                    </div>
                )}

                {eventResult && (
                    <div className="ef-match-overlay">
                        <EfPanel padding="lg" className={resultIsSuccess ? 'ef-pmatch__result-panel--success' : 'ef-pmatch__result-panel--fail'}>
                            <div className="ef-pmatch__result-icon">
                                {resultIsSuccess
                                    ? <CheckCircle size={48} color="var(--primary)" weight="fill" />
                                    : <WarningCircle size={48} color="var(--danger)" weight="fill" />}
                            </div>
                            <p className="ef-pmatch__result-text">
                                {resultText}
                            </p>
                        </EfPanel>
                    </div>
                )}

                <EfPanel padding="lg" className="ef-pmatch__narration-panel">
                    <div className="ef-pmatch__narration-header">
                        <Flag size={20} /> LANCES DA PARTIDA
                    </div>

                    <div className="ef-match-narration">
                        {narration.length === 0 && <span className="ef-match-narration-empty">Aguardando o apito inicial...</span>}
                        {narration.map((n, i) => (
                            <div key={i} className={`ef-match-narration-row ${n.isGoal ? 'ef-match-narration-row--goal' : ''}`}>
                                <span className="ef-match-narration-row__min">{n.minute}'</span>
                                <span>{n.text}</span>
                                {n.isGoal && <SoccerBall size={16} color="var(--primary)" weight="fill" className="ef-pmatch__goal-icon" />}
                            </div>
                        ))}
                    </div>
                </EfPanel>

                {matchFinished && (
                    <div className="ef-anim-slide-up">
                        <EfButton variant="primary" size="lg" onClick={handleEndMatch} className="ef-pmatch__end-btn">
                            <TrendUp size={24} weight="bold" /> VER RESULTADOS E AVANÇAR
                        </EfButton>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PlayerMatchView;
