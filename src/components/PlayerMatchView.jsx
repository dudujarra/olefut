import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { drawCard } from '../engine/MatchEventsDeck';
import { BenchEventsDeck } from '../engine/BenchEventsDeck';
import { EfClubBadge } from './ui';

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
                if (Math.random() < 0.04) {
                    if (Math.random() > 0.5) {
                        setHomeGoals(g => g + 1);
                        setNarration(n => [...n, { minute: next, text: `⚽ GOOOL do ${team.name}!`, isGoal: true }]);
                    } else {
                        setAwayGoals(g => g + 1);
                        setNarration(n => [...n, { minute: next, text: `⚽ Gol do adversário.`, isGoal: true }]);
                    }
                }

                // Player events
                if (!isBenched && !activeEvent && next % 20 === 0 && next < 90 && Math.random() < 0.6) {
                    clearInterval(timerRef.current);
                    const card = drawCard(player.position);
                    if (card) setActiveEvent(card);
                }

                // Bench events
                if (isBenched && next % 25 === 0 && Math.random() < 0.5) {
                    clearInterval(timerRef.current);
                    const card = BenchEventsDeck[Math.floor(Math.random() * BenchEventsDeck.length)];
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
            const finalPower = player.skills[option.skill] * energyFactor * Math.random();
            const defPower = option.difficulty * Math.random();
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
                setEventResult(`✅ ${option.successText}`);
            } else {
                player.relationships.boss = Math.max(0, Math.min(100, player.relationships.boss + (option.bossFailure || 0)));
                player.relationships.fans = Math.max(0, Math.min(100, player.relationships.fans + (option.fansFailure || 0)));
                if (option.failType === 'goal_conceded' || option.failType === 'penalty_given') {
                    setAwayGoals(g => g + 1);
                }
                setEventResult(`❌ ${option.failText}`);
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

    return (
        <div className="main-content fade-in">
            {isBenched && <div className="bench-warning">🔴 VOCÊ ESTÁ NO BANCO — Observe e interaja com os eventos</div>}

            <div className={`card ${goalBurstActive ? 'ef-anim-shake' : ''}`} style={{ textAlign: 'center', position: 'relative' }}>
                {goalBurstActive && (
                    <div className="ef-anim-goal-burst" style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:10,pointerEvents:'none'}} />
                )}
                <div className="match-teams" style={{display:'flex',alignItems:'center',justifyContent:'space-around',gap:'1rem'}}>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
                        {team?.name && <EfClubBadge name={team.name} size="md" />}
                        <span className="team-name">{team?.name || 'Meu Time'}</span>
                    </div>
                    <div className={`match-score ${goalBurstActive ? 'ef-anim-counter' : ''}`}>{homeGoals} — {awayGoals}</div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
                        {opponent?.name && <EfClubBadge name={opponent.name} size="md" />}
                        <span className="team-name">{opponent?.name || 'Adversário'}</span>
                    </div>
                </div>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{matchFinished ? 'FIM DE JOGO' : `${minute}'`}</p>
                <div style={{ background: 'var(--bg-panel-hover)', height: '4px', borderRadius: '2px', marginTop: '0.5rem' }}>
                    <div style={{ width: `${(minute / 90) * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: '2px', transition: 'width 0.3s' }} />
                </div>
            </div>

            {/* Event Modal */}
            {activeEvent && !eventResult && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{activeEvent.isBench ? '📋 Evento no Banco' : `⚡ Momento Decisivo — ${minute}'`}</h3>
                        <p>{activeEvent.text}</p>
                        <div className="modal-options">
                            {activeEvent.options.map((opt, i) => (
                                <button key={i} className="btn btn-secondary" onClick={() => handleChoice(opt)}>
                                    {opt.label}
                                    {opt.skill && <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginLeft: '0.5rem' }}>({opt.skill})</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Event Result */}
            {eventResult && (
                <div className="card" style={{ textAlign: 'center', borderColor: 'var(--accent)' }}>
                    <p style={{ fontSize: '1rem' }}>{eventResult}</p>
                </div>
            )}

            {/* Narration */}
            <div className="narration-log">
                {narration.length === 0 && <span>Aguardando início...</span>}
                {narration.map((n, i) => (
                    <div key={i} className={n.isGoal ? 'goal-line' : ''}>{n.minute}' — {n.text}</div>
                ))}
            </div>

            {matchFinished && (
                <button className="btn btn-primary" onClick={handleEndMatch} style={{ width: '100%', marginTop: '1rem' }}>
                    📊 Ver Resultados e Avançar Semana
                </button>
            )}
        </div>
    );
}
