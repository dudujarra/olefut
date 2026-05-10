import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { drawCard } from '../engine/MatchEventsDeck';
import { BenchEventsDeck } from '../engine/BenchEventsDeck';
import { EfClubBadge } from './ui';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';
import bgMatchStadium from '../assets/environments/bg_match_stadium.png';

import { rng as systemRng } from '../engine/rng.js';

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
                if (systemRng() < 0.04) {
                    if (systemRng() > 0.5) {
                        setHomeGoals(g => g + 1);
                        setNarration(n => [...n, { minute: next, text: `⚽ GOOOL do ${team.name}!`, isGoal: true }]);
                    } else {
                        setAwayGoals(g => g + 1);
                        setNarration(n => [...n, { minute: next, text: `⚽ Gol do adversário.`, isGoal: true }]);
                    }
                }

                // Player events
                if (!isBenched && !activeEvent && next % 20 === 0 && next < 90 && systemRng() < 0.6) {
                    clearInterval(timerRef.current);
                    const card = drawCard(player.position);
                    if (card) setActiveEvent(card);
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
        <div className="ef-anim-fade-in" style={{
            backgroundImage: `url(${bgMatchStadium})`,
            imageRendering: 'pixelated',
            WebkitImageRendering: 'pixelated',
            backgroundColor: '#0A130E',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            minHeight: '100dvh',
            padding: '16px',
            color: '#E2E8F0'
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {isBenched && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#FF3333', padding: '12px', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }}>🔴 VOCÊ ESTÁ NO BANCO — Observe e interaja com os eventos</div>}

                <EfPanel variant="elev" padding="md" className={goalBurstActive ? 'ef-anim-shake' : ''} style={{ textAlign: 'center', position: 'relative' }}>
                    {goalBurstActive && (
                        <div className="ef-anim-goal-burst" style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:10,pointerEvents:'none'}} />
                    )}
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-around',gap:'1rem'}}>
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
                            {team?.name && <EfClubBadge name={team.name} size="md" />}
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#E2E8F0' }}>{team?.name || 'Meu Time'}</span>
                        </div>
                        <div className={goalBurstActive ? 'ef-anim-counter' : ''} style={{ fontSize: '2.5rem', fontWeight: 800, color: '#39FF14', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{homeGoals} — {awayGoals}</div>
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
                            {opponent?.name && <EfClubBadge name={opponent.name} size="md" />}
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#E2E8F0' }}>{opponent?.name || 'Adversário'}</span>
                        </div>
                    </div>
                    <p style={{ color: '#888', marginTop: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>{matchFinished ? 'FIM DE JOGO' : `${minute}'`}</p>
                    <div style={{ background: '#111417', height: '6px', borderRadius: '3px', marginTop: '0.5rem', border: '1px solid #333' }}>
                        <div style={{ width: `${(minute / 90) * 100}%`, height: '100%', background: '#6ABC3A', borderRadius: '2px', transition: 'width 0.3s' }} />
                    </div>
                </EfPanel>

                {/* Event Modal */}
                {activeEvent && !eventResult && (
                    <div className="modal-overlay">
                        <EfPanel variant="elev" padding="md" style={{ maxWidth: '400px', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: activeEvent.isBench ? '#E2E8F0' : '#FFD700' }}>{activeEvent.isBench ? '📋 Evento no Banco' : `⚡ Momento Decisivo — ${minute}'`}</h3>
                            <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>{activeEvent.text}</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {activeEvent.options.map((opt, i) => (
                                    <EfButton key={i} variant="secondary" onClick={() => handleChoice(opt)}>
                                        {opt.label}
                                        {opt.skill && <span style={{ color: '#888', fontSize: '0.7rem', marginLeft: '0.5rem' }}>({opt.skill})</span>}
                                    </EfButton>
                                ))}
                            </div>
                        </EfPanel>
                    </div>
                )}

                {/* Event Result */}
                {eventResult && (
                    <EfPanel variant="elev" padding="md" style={{ textAlign: 'center', border: '2px solid #FFD700' }}>
                        <p style={{ fontSize: '1rem', margin: 0 }}>{eventResult}</p>
                    </EfPanel>
                )}

                {/* Narration */}
                <EfPanel variant="sunk" padding="md" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {narration.length === 0 && <span style={{ color: '#888' }}>Aguardando início...</span>}
                    {narration.map((n, i) => (
                        <div key={i} style={{ 
                            padding: '4px 8px', 
                            borderLeft: n.isGoal ? '3px solid #39FF14' : 'none',
                            background: n.isGoal ? 'rgba(106, 188, 58, 0.1)' : 'transparent',
                            color: n.isGoal ? '#E2E8F0' : '#888',
                            fontSize: '0.85rem',
                            marginBottom: '4px'
                        }}>{n.minute}' — {n.text}</div>
                    ))}
                </EfPanel>

                {matchFinished && (
                    <EfButton variant="primary" onClick={handleEndMatch} style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '1.1rem' }}>
                        📊 VER RESULTADOS E AVANÇAR
                    </EfButton>
                )}
            </div>
        </div>
    );
}

export default PlayerMatchView;
