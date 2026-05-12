import { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { drawCard } from '../engine/MatchEventsDeck';
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
                {isBenched && (
                    <div style={{ 
                        backgroundColor: colors.bg, 
                        color: colors.danger, 
                        padding: '16px', 
                        textAlign: 'center', 
                        fontWeight: 'bold',
                        border: `1px solid ${colors.danger}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}>
                        <UserMinus size={24} weight="fill" /> VOCÊ ESTÁ NO BANCO — Observe e interaja com os eventos
                    </div>
                )}

                {/* Scoreboard Panel */}
                <EfPanel padding="lg" className={goalBurstActive ? 'ef-anim-shake' : ''} style={{ textAlign: 'center', position: 'relative' }}>
                    {goalBurstActive && (
                        <div className="ef-anim-goal-burst" style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:10,pointerEvents:'none'}} />
                    )}
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between', padding: '0 24px'}}>
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'8px', flex: 1}}>
                            {team?.name ? (
                                <EfClubBadge name={team.name} size="md" />
                            ) : (
                                <div style={{ width: '64px', height: '64px', backgroundColor: colors.bg, }} />
                            )}
                            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: colors.text, fontFamily: 'var(--font-sans)' }}>{team?.name || 'Meu Time'}</span>
                        </div>
                        
                        <div className={goalBurstActive ? 'ef-anim-counter' : ''} style={{ 
                            fontSize: '3.5rem', 
                            fontWeight: '800', 
                            color: colors.accent, 
                            fontFamily: 'var(--font-mono)',
                            padding: '0 32px',
                            backgroundColor: colors.bg,
                            border: `2px solid ${colors.border}`
                        }}>
                            {homeGoals} <span style={{ color: colors.border }}>-</span> {awayGoals}
                        </div>
                        
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'8px', flex: 1}}>
                            {opponent?.name ? (
                                <EfClubBadge name={opponent.name} size="md" />
                            ) : (
                                <div style={{ width: '64px', height: '64px', backgroundColor: colors.bg, }} />
                            )}
                            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: colors.text, fontFamily: 'var(--font-sans)' }}>{opponent?.name || 'Adversário'}</span>
                        </div>
                    </div>
                    
                    <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.secondary, fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                            <Clock size={24} weight="bold" /> {matchFinished ? 'FIM DE JOGO' : `${minute}'`}
                        </div>
                        <div style={{ width: '100%', maxWidth: '400px', backgroundColor: colors.bg, height: '8px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
                            <div style={{ width: `${(minute / 90) * 100}%`, height: '100%', backgroundColor: colors.secondary, transition: 'width 0.3s ease' }} />
                        </div>
                    </div>
                </EfPanel>

                {/* Event Modal Overlay */}
                {activeEvent && !eventResult && (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: '#111417',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100,
                        padding: '24px'
                    }}>
                        <EfPanel padding="lg" style={{ maxWidth: '500px', width: '100%', border: `2px solid ${activeEvent.isBench ? colors.border : colors.warning}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: activeEvent.isBench ? colors.text : colors.warning }}>
                                {activeEvent.isBench ? <Question size={32} /> : <WarningCircle size={32} weight="fill" />}
                                <h3 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '1.2rem' }}>
                                    {activeEvent.isBench ? '📋 DECISÃO NO BANCO' : `⚡ MOMENTO DECISIVO — ${minute}'`}
                                </h3>
                            </div>
                            
                            <p style={{ fontSize: '1rem', lineHeight: '1.6', color: colors.text, marginBottom: '24px' }}>
                                {activeEvent.text}
                            </p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {activeEvent.options.map((opt, i) => (
                                    <EfButton key={i} variant="secondary" onClick={() => handleChoice(opt)} style={{ justifyContent: 'space-between', padding: '16px' }}>
                                        <span>{opt.label}</span>
                                        {opt.skill && <span style={{ color: colors.secondary, fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>[{opt.skill.toUpperCase()}]</span>}
                                    </EfButton>
                                ))}
                            </div>
                        </EfPanel>
                    </div>
                )}

                {/* Event Result Overlay */}
                {eventResult && (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: '#111417',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100,
                        padding: '24px'
                    }}>
                        <EfPanel padding="lg" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', border: `2px solid ${eventResult.includes('✅') ? colors.accent : colors.danger}` }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                                {eventResult.includes('✅') ? <CheckCircle size={48} color={colors.accent} weight="fill" /> : <WarningCircle size={48} color={colors.danger} weight="fill" />}
                            </div>
                            <p style={{ fontSize: '1.2rem', margin: 0, color: colors.text, fontWeight: 'bold' }}>
                                {eventResult.replace('✅ ', '').replace('❌ ', '')}
                            </p>
                        </EfPanel>
                    </div>
                )}

                {/* Narration */}
                <EfPanel padding="lg" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.text, marginBottom: '16px', fontWeight: 'bold' }}>
                        <Flag size={20} /> LANCES DA PARTIDA
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
                        {narration.length === 0 && <span style={{ color: colors.textMuted, fontStyle: 'italic', padding: '12px', textAlign: 'center' }}>Aguardando o apito inicial...</span>}
                        {narration.map((n, i) => (
                            <div key={i} style={{ 
                                padding: '12px 16px', 
                                borderLeft: n.isGoal ? `4px solid ${colors.accent}` : `4px solid ${colors.border}`,
                                backgroundColor: n.isGoal ? colors.bg : colors.panelElevated,
                                color: colors.text,
                                fontSize: '0.95rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: n.isGoal ? colors.accent : colors.secondary, width: '32px' }}>{n.minute}'</span>
                                <span>{n.text.replace('⚽ ', '')}</span>
                                {n.isGoal && <SoccerBall size={16} color={colors.accent} weight="fill" style={{ marginLeft: 'auto' }} />}
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
