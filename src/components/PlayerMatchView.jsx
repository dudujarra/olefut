import { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { drawCard, enrichCardWithAtmosphere } from '../engine/MatchEventsDeck';
import { BenchEventsDeck } from '../engine/BenchEventsDeck';
import { EfClubBadge, EfPanel, EfButton } from './ui';
import bgMatchStadium from '../assets/environments/bg_match_stadium.png';
import { rng as systemRng } from '../engine/rng.js';

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

    // Trigger goal-burst quando homeGoals incrementar
    useEffect(() => {
        if (homeGoals > prevHomeGoalsRef.current) {
            setGoalBurstActive(true);
            const t = setTimeout(() => setGoalBurstActive(false), 1300);
            prevHomeGoalsRef.current = homeGoals;
            return () => clearTimeout(t);
        }
        prevHomeGoalsRef.current = homeGoals;
    }, [homeGoals]);

    // BUG-081 (SPEC-158): aceitável — player.checkBenchStatus() muta engine (side effect).
    // Busca oponente em engine.tournaments também é lookup externo.
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        player.checkBenchStatus();
        setIsBenched(player.isBenched);

        // Find opponent
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

                // Random events
                if (systemRng() < 0.04) {
                    if (systemRng() > 0.5) {
                        setHomeGoals(g => g + 1);
                        setNarration(n => [...n, { minute: next, text: `GOOOL do ${team.name}!`, isGoal: true }]);
                    } else {
                        setAwayGoals(g => g + 1);
                        setNarration(n => [...n, { minute: next, text: `Gol do adversário.`, isGoal: true }]);
                    }
                }

                // Player events (SPEC-B6.3 — enriquece com atmosfera BR)
                if (!isBenched && !activeEvent && next % 20 === 0 && next < 90 && systemRng() < 0.6) {
                    clearInterval(timerRef.current);
                    const card = drawCard(player.position);
                    if (card) {
                        // Map position → atmosphere eventType (50% chance prefix)
                        const seed = next + (player.id || 0);
                        const enrichEvtType = (player.position === 'ATA' && systemRng() < 0.4) ? 'goal'
                            : (player.position === 'GOL' && systemRng() < 0.4) ? 'save'
                            : (player.position === 'DEF' && systemRng() < 0.3) ? 'card'
                            : null;
                        const enriched = enrichEvtType ? enrichCardWithAtmosphere(card, enrichEvtType, seed) : card;
                        setActiveEvent(enriched);
                    }
                }

                // Bench events
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
            // Bench event
            const eff = option.effect;
            if (eff.boss) player.relationships.boss = Math.max(0, Math.min(100, player.relationships.boss + eff.boss));
            if (eff.fans) player.relationships.fans = Math.max(0, Math.min(100, player.relationships.fans + eff.fans));
            if (eff.teammates) player.relationships.teammates = Math.max(0, Math.min(100, player.relationships.teammates + eff.teammates));
            if (eff.energy) player.energy = Math.max(0, Math.min(100, player.energy + eff.energy));
            setEventResult(option.resultText);
        } else {
            // Match RPG event
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
        <div className="ef-anim-fade-in ef-scene-shell" style={{ backgroundImage: `url(${bgMatchStadium})` }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {isBenched && (
                    <div className="ef-bench-banner">
                        <UserMinus size={24} weight="fill" /> VOCÊ ESTÁ NO BANCO — Observe e interaja com os eventos
                    </div>
                )}

                {/* Scoreboard Panel */}
                <EfPanel padding="lg" className={`ef-match-scoreboard ${goalBurstActive ? 'ef-anim-shake' : ''}`}>
                    {goalBurstActive && (
                        <div className="ef-anim-goal-burst" style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:10,pointerEvents:'none'}} />
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

                {/* Event Modal Overlay */}
                {activeEvent && !eventResult && (
                    <div className="ef-match-overlay">
                        <EfPanel padding="lg" style={{ maxWidth: '500px', width: '100%', border: `2px solid ${activeEvent.isBench ? '#2D3748' : '#FFD700'}` }}>
                            <div className="ef-match-event-header" style={{ color: activeEvent.isBench ? '#FDFBF7' : '#FFD700' }}>
                                {activeEvent.isBench ? <Question size={32} /> : <WarningCircle size={32} weight="fill" />}
                                <h3 className="ef-match-event-title">
                                    {activeEvent.isBench ? 'DECISÃO NO BANCO' : `MOMENTO DECISIVO — ${minute}'`}
                                </h3>
                            </div>

                            <p className="ef-match-event-text">
                                {activeEvent.text}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {activeEvent.options.map((opt, i) => (
                                    <EfButton key={i} variant="secondary" onClick={() => handleChoice(opt)} style={{ justifyContent: 'space-between', padding: '16px' }}>
                                        <span>{opt.label}</span>
                                        {opt.skill && <span className="ef-mono" style={{ color: '#40BAF7', fontSize: '0.8rem' }}>[{opt.skill.toUpperCase()}]</span>}
                                    </EfButton>
                                ))}
                            </div>
                        </EfPanel>
                    </div>
                )}

                {/* Event Result Overlay */}
                {eventResult && (
                    <div className="ef-match-overlay">
                        <EfPanel padding="lg" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', border: `2px solid ${resultIsSuccess ? '#39FF14' : '#FF3333'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                                {resultIsSuccess
                                    ? <CheckCircle size={48} color="#39FF14" weight="fill" />
                                    : <WarningCircle size={48} color="#FF3333" weight="fill" />}
                            </div>
                            <p style={{ fontSize: '1.2rem', margin: 0, color: '#FDFBF7', fontWeight: 'bold' }}>
                                {resultText}
                            </p>
                        </EfPanel>
                    </div>
                )}

                {/* Narration */}
                <EfPanel padding="lg" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FDFBF7', marginBottom: '16px', fontWeight: 'bold' }}>
                        <Flag size={20} /> LANCES DA PARTIDA
                    </div>

                    <div className="ef-match-narration">
                        {narration.length === 0 && <span className="ef-match-narration-empty">Aguardando o apito inicial...</span>}
                        {narration.map((n, i) => (
                            <div key={i} className={`ef-match-narration-row ${n.isGoal ? 'ef-match-narration-row--goal' : ''}`}>
                                <span className="ef-match-narration-row__min">{n.minute}'</span>
                                <span>{n.text}</span>
                                {n.isGoal && <SoccerBall size={16} color="#39FF14" weight="fill" style={{ marginLeft: 'auto' }} />}
                            </div>
                        ))}
                    </div>
                </EfPanel>

                {matchFinished && (
                    <div className="ef-anim-slide-up">
                        <EfButton variant="primary" size="lg" onClick={handleEndMatch} style={{ width: '100%', justifyContent: 'center', padding: '20px', fontSize: '1.1rem' }}>
                            <TrendUp size={24} weight="bold" /> VER RESULTADOS E AVANÇAR
                        </EfButton>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PlayerMatchView;
