import { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { TACTICS, FORMATIONS, TEAM_TALKS } from '../engine/ManagerSystems';
import { getFormEmoji } from '../engine/PlayerDevelopment';
import { sfx } from '../utils/sound';
import { LiveSquadEditModal } from './LiveSquadEditModal';
import { PreMatchScreen } from './PreMatchScreen';
import { MatchPostMortem } from './MatchPostMortem';
import { analyzeMatch } from '../engine/MatchAnalyst';
import { MidMatchCardModal } from './MidMatchCardModal';
import { shouldTriggerMidMatch, getMidMatchCard } from '../engine/MidMatchManagerDeck';
import { EfClubBadge, EfBanner } from './ui';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';

import { 
    SoccerBall, Cardholder, FirstAid, ArrowsLeftRight, Hand, 
    Play, Pause, FastForward, SkipForward, Megaphone, 
    Shield, Strategy, ListNumbers, UserList, CheckCircle, Warning, 
    ChartBar, MicrophoneStage, ArrowLeft
} from '@phosphor-icons/react';

export function MatchView() {
    const { gameState, changeView, getEngine, forceUpdate, getDashboardView } = useGame();
    const engine = getEngine();
    const team = engine.getTeam(gameState.teamId);
    
    const [phase, setPhase] = useState('prematch');
    const [result, setResult] = useState(null);
    const [narration, setNarration] = useState([]);
    const [displayedEvents, setDisplayedEvents] = useState([]);
    const [currentMinute, setCurrentMinute] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [halfTimeData, setHalfTimeData] = useState(null);
    const [subUsed, setSubUsed] = useState(false);
    const [tacticChanged, setTacticChanged] = useState(false);
    const [matchStats, setMatchStats] = useState(null);
    const [preStep, setPreStep] = useState(1); // 1=squad, 2=tactics, 3=confirm
    const [talkDone, setTalkDone] = useState(false);
    const [speed, setSpeed] = useState(200); // ms per tick
    const [paused, setPaused] = useState(false);
    const [liveModalOpen, setLiveModalOpen] = useState(false);
    const [liveSubsCount, setLiveSubsCount] = useState(0);
    const [goalBurstActive, setGoalBurstActive] = useState(false);
    const [eventOverlay, setEventOverlay] = useState(null); // 'card'|'injury'|'sub'|'whistle'
    const [banner, setBanner] = useState(null); // null | 'hattrick' | 'cleanSheet' | 'motm'
    
    const logRef = useRef(null);
    const timerRef = useRef(null);
    const speedRef = useRef(200);
    const pausedRef = useRef(false);

    // SPEC-B2.2: mid-match card state
    const [midMatchCard, setMidMatchCard] = useState(null);
    const triggeredMinutesRef = useRef(new Set());

    const cond = engine.matchCondition;
    const tactic = TACTICS[engine.currentTactic];

    // BUG-081 (SPEC-158): aceitável — banner dispara em transição de fase (event-driven).
    // setState aciona banner UI; parse de narration tem side effects (regex match).
    /* eslint-disable react-hooks/set-state-in-effect */
    // Detect hat-trick + clean-sheet at fulltime
    useEffect(() => {
        if (phase !== 'fulltime' || !narration?.length) return;
        const scorerCounts = {};
        narration.forEach(n => {
            const m = n.text?.match(/⚽.*?([A-ZÁÉÍÓÚÃÕÇ][a-záéíóúãõç]+(?:\s[A-Z][a-z]+)*)/);
            if (m) scorerCounts[m[1]] = (scorerCounts[m[1]] || 0) + 1;
        });
        const hasHattrick = Object.values(scorerCounts).some(c => c >= 3);
        if (hasHattrick) { setBanner('hattrick'); return; }

        const isHome = result?.home === team.name;
        const myGoals = isHome ? result?.homeGoals : result?.awayGoals;
        const oppGoals = isHome ? result?.awayGoals : result?.homeGoals;
        if (oppGoals === 0 && myGoals > 0) setBanner('cleanSheet');
    }, [phase, narration, result, team.name]);
    /* eslint-enable react-hooks/set-state-in-effect */

    // SPEC-B2.2: trigger mid-match decision card at minutes 15/30/45/60/75 (30% chance)
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (phase !== 'firsthalf' && phase !== 'secondhalf') return;
        if (midMatchCard) return; // already showing one
        if (!shouldTriggerMidMatch(currentMinute, triggeredMinutesRef.current)) return;
        // 30% chance (deterministic via minute+matchId hash if available)
        const seed = (currentMinute * 7) + (result?.homeTeamId || 0);
        const roll = (Math.abs(seed) % 100);
        if (roll < 30) {
            const card = getMidMatchCard(currentMinute, seed);
            if (card) {
                setMidMatchCard(card);
                triggeredMinutesRef.current.add(currentMinute);
            }
        } else {
            triggeredMinutesRef.current.add(currentMinute);
        }
    }, [currentMinute, phase, midMatchCard, result]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const handleMidMatchChoose = (opt) => {
        if (!opt) return;
        try {
            const t = engine.getTeam(gameState.teamId);
            if (t && typeof opt.effect?.moralDelta === 'number') {
                t.moral = Math.max(0, Math.min(100, (t.moral ?? 50) + opt.effect.moralDelta));
            }
            if (t && typeof opt.effect?.energyDelta === 'number' && Array.isArray(t.squad)) {
                t.squad.forEach(p => {
                    if (typeof p.energy === 'number') {
                        p.energy = Math.max(0, Math.min(100, p.energy + opt.effect.energyDelta));
                    }
                });
            }
            if (typeof opt.effect?.tacticShift === 'string' && engine.setTactic) {
                engine.setTactic(opt.effect.tacticShift);
            }
        } catch { /* defensive */ }
    };

    // Auto-scroll narration log
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [displayedEvents]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    // Sync speedRef when speed state changes
    useEffect(() => {
        speedRef.current = speed;
        // Restart interval with new speed if currently playing
        if (timerRef.current && tickerStateRef.current) {
            clearInterval(timerRef.current);
            const { events, endMin, onComplete } = tickerStateRef.current;
            let min = tickerStateRef.current.currentMin;
            let eventIdx = tickerStateRef.current.eventIdx;
            const eventQueue = tickerStateRef.current.eventQueue;

            timerRef.current = setInterval(() => {
                if (pausedRef.current) return;
                min++;
                tickerStateRef.current.currentMin = min;
                setCurrentMinute(min);
                while (eventIdx < eventQueue.length && eventQueue[eventIdx].minute <= min) {
                    setDisplayedEvents(prev => [...prev, eventQueue[eventIdx]]);
                    eventIdx++;
                    tickerStateRef.current.eventIdx = eventIdx;
                }
                if (min >= endMin) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                    tickerStateRef.current = null;
                    setIsPlaying(false);
                    if (onComplete) onComplete();
                }
            }, speedRef.current);
        }
    }, [speed]);

    const tickerStateRef = useRef(null);

    // === LIVE MATCH TICKER ===
    const startLiveTicker = (events, startMin, endMin, onComplete) => {
        setIsPlaying(true);
        let min = startMin;
        const eventQueue = events.filter(e => e && e.minute >= startMin && e.minute <= endMin);
        let eventIdx = 0;

        tickerStateRef.current = { events, eventQueue, endMin, onComplete, currentMin: min, eventIdx };

        timerRef.current = setInterval(() => {
            if (pausedRef.current) return;
            min++;
            tickerStateRef.current.currentMin = min;
            setCurrentMinute(min);

            while (eventIdx < eventQueue.length && eventQueue[eventIdx].minute <= min) {
                const ev = eventQueue[eventIdx];
                setDisplayedEvents(prev => {
                    // dedupe via key
                    const key = `${ev.minute}-${ev.text}`;
                    if (prev.some(e => e && `${e.minute}-${e.text}` === key)) return prev;
                    return [...prev, ev];
                });
                
                if (ev.text?.includes('⚽')) {
                    sfx.goal();
                    setGoalBurstActive(true);
                    setTimeout(() => setGoalBurstActive(false), 1300);
                } else if (ev.text?.includes('🟨') || ev.text?.includes('🟥')) {
                    sfx.card();
                    setEventOverlay(ev.text.includes('🟥') ? 'ef-event-redcard' : 'ef-event-foul');
                    setTimeout(() => setEventOverlay(null), 1200);
                } else if (ev.text?.includes('🤕')) {
                    setEventOverlay('ef-event-injury');
                    setTimeout(() => setEventOverlay(null), 1200);
                } else if (ev.text?.includes('🔄') || ev.text?.includes('substitui')) {
                    setEventOverlay('ef-event-sub');
                    setTimeout(() => setEventOverlay(null), 1200);
                } else if (ev.text?.includes('🧤') || ev.text?.match(/defes|defen|salvou|defesa/i)) {
                    setEventOverlay('ef-event-save');
                    setTimeout(() => setEventOverlay(null), 1200);
                }
                eventIdx++;
                tickerStateRef.current.eventIdx = eventIdx;
            }

            if (min >= endMin) {
                clearInterval(timerRef.current);
                timerRef.current = null;
                tickerStateRef.current = null;
                setIsPlaying(false);
                if (onComplete) onComplete();
            }
        }, speedRef.current);
    };

    const skipToEnd = (events, endMin, onComplete) => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        const startMin = tickerStateRef.current?.eventQueue?.[0]?.minute || 0;
        const remaining = events.filter(e => e && e.minute >= startMin && e.minute <= endMin);
        setDisplayedEvents(prev => {
            const existingMinutes = new Set(prev.map(e => `${e.minute}-${e.text}`));
            const newEvents = remaining.filter(e => !existingMinutes.has(`${e.minute}-${e.text}`));
            return [...prev, ...newEvents];
        });
        setCurrentMinute(endMin);
        setIsPlaying(false);
        tickerStateRef.current = null;
        if (onComplete) onComplete();
    };

    const getDisplayScore = () => {
        if (!result) return { home: 0, away: 0 };
        let h = 0, a = 0;
        (displayedEvents || []).forEach(e => {
            if (!e || !e.text) return;
            if (e.text.includes('⚽')) {
                const match = e.text.match(/\((\d+)\s*x\s*(\d+)\)/);
                if (match) { h = parseInt(match[1]); a = parseInt(match[2]); }
            }
        });
        return { home: h, away: a };
    };

    // Color definitions
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

    const getEnergyColor = (e) => e < 40 ? colors.danger : e < 70 ? colors.warning : colors.accent;

    // === PRE-MATCH ===
    if (phase === 'prematch') {
        const titulares = team.squad.filter(p => p.isTitular && !p.injury);
        const lowEnergy = titulares.filter(p => p.energy < 40);
        const sectors = engine.getTeamSectors(team.id);

        const launchMatch = () => {
            const weekResults = engine.advanceWeek();
            let myMatch = null;
            for (const tId in weekResults) {
                const match = weekResults[tId].find(m => (m.home === team.id || m.away === team.id) && m.score);
                if (match) { myMatch = match; break; }
            }

            if (myMatch && myMatch.score) {
                const isHome = myMatch.home === team.id;
                const opponent = engine.getTeam(isHome ? myMatch.away : myMatch.home);
                const allEvents = myMatch.score.events?.textLog || [];
                const htHomeGoals = myMatch.score.events?.home?.filter(e => e && e.minute <= 45).length || 0;
                const htAwayGoals = myMatch.score.events?.away?.filter(e => e && e.minute <= 45).length || 0;

                setResult({
                    home: isHome ? team.name : opponent.name,
                    away: isHome ? opponent.name : team.name,
                    homeGoals: myMatch.score.homeGoals,
                    awayGoals: myMatch.score.awayGoals,
                });
                setNarration(allEvents);
                setHalfTimeData({
                    homeGoals: isHome ? htHomeGoals : htAwayGoals,
                    awayGoals: isHome ? htAwayGoals : htHomeGoals,
                });

                const totalChances = allEvents.filter(e => e && e.text && (e.text.includes('⚽') || e.text.includes('Defesa') || e.text.includes('salva'))).length;
                const goals = allEvents.filter(e => e && e.text && e.text.includes('⚽')).length;
                setMatchStats({ totalChances, goals, injuries: (engine.weekInjuries?.length ?? 0) });

                setDisplayedEvents([]);
                setCurrentMinute(0);
                setPhase('firsthalf');
                setTimeout(() => startLiveTicker(allEvents, 0, 45, null), 300);
            } else {
                setResult({ home: team.name, away: 'Sem Jogo', homeGoals: '-', awayGoals: '-' });
                setPhase('fulltime');
            }
            forceUpdate();
        };

        const matchContext = engine.getMatchContext ? engine.getMatchContext() : null;

        return (
            <div className="ef-view-shell">
                <div className="ef-view-container">

                    {matchContext && (
                        <PreMatchScreen
                            team={team}
                            context={matchContext}
                            sectors={sectors}
                            engine={engine}
                            onSaveLayout={() => forceUpdate()}
                        />
                    )}

                    <EfPanel padding="md" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px' }}>
                        {[
                            { step: 1, label: 'ESCALAÇÃO', icon: <UserList size={20} /> },
                            { step: 2, label: 'TÁTICA', icon: <Strategy size={20} /> },
                            { step: 3, label: 'CONFIRMAÇÃO', icon: <CheckCircle size={20} /> }
                        ].map(({ step, label, icon }) => {
                            const stepClass = preStep > step
                                ? 'ef-step ef-step--done'
                                : preStep === step
                                    ? 'ef-step ef-step--active'
                                    : 'ef-step';
                            return (
                                <div key={step} className={stepClass}>
                                    <div className="ef-step__bubble">
                                        {preStep > step ? <CheckCircle weight="fill" /> : icon}
                                    </div>
                                    {label}
                                </div>
                            );
                        })}
                    </EfPanel>

                    {preStep === 1 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                            <EfPanel padding="md">
                                <div className="ef-section-header">
                                    <ListNumbers size={24} color={colors.warning} />
                                    <h3>SETORES DO PLANTEL</h3>
                                </div>
                                <div className="ef-sector-grid">
                                    <div className="ef-sector-cell"><div className="ef-sector-cell__value ef-text-accent">{sectors.goalkeeper}</div><div className="ef-sector-cell__label">GOL</div></div>
                                    <div className="ef-sector-cell"><div className="ef-sector-cell__value ef-text-info">{sectors.defense}</div><div className="ef-sector-cell__label">DEF</div></div>
                                    <div className="ef-sector-cell"><div className="ef-sector-cell__value ef-text-primary">{sectors.midfield}</div><div className="ef-sector-cell__label">MEI</div></div>
                                    <div className="ef-sector-cell"><div className="ef-sector-cell__value ef-text-danger">{sectors.attack}</div><div className="ef-sector-cell__label">ATA</div></div>
                                </div>
                            </EfPanel>

                            <EfPanel padding="md">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <div className="ef-section-header" style={{ marginBottom: 0 }}>
                                        <UserList size={24} color={colors.secondary} />
                                        <h3>TITULARES ({titulares.length})</h3>
                                    </div>
                                    {lowEnergy.length > 0 && (
                                        <div className="ef-text-danger" style={{ backgroundColor: '#8B0000', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Warning /> {lowEnergy.length} COM ENERGIA BAIXA
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {titulares.map(p => (
                                        <div key={p.id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '12px', border: `1px solid ${colors.border}`,
                                            backgroundColor: p.energy < 40 ? '#2D1616' : colors.panelElevated,
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div className="ef-mono ef-text-muted" style={{ width: '40px', textAlign: 'center', backgroundColor: colors.bg, padding: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                    {p.position}
                                                </div>
                                                <div className="ef-sans ef-text-main" style={{ fontWeight: 'bold' }}>
                                                    {p.name} {p._isCaptain && '©️'} {getFormEmoji(p.form?.trend)}
                                                </div>
                                            </div>
                                            <div className="ef-mono" style={{ display: 'flex', alignItems: 'center', gap: '16px', fontWeight: 'bold' }}>
                                                <div className="ef-text-main">OVR: {p.ovr}</div>
                                                <div style={{ color: getEnergyColor(p.energy), minWidth: '80px', textAlign: 'right' }}>COND: {p.energy}%</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </EfPanel>
                            
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                                <EfButton variant="secondary" onClick={() => changeView(getDashboardView())}>
                                    <ArrowLeft size={16} /> VOLTAR AO DASHBOARD
                                </EfButton>
                                <EfButton variant="primary" onClick={() => setPreStep(2)}>
                                    PRÓXIMO: TÁTICA <SkipForward size={16} />
                                </EfButton>
                            </div>
                        </div>
                    )}

                    {preStep === 2 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                            <EfPanel padding="md">
                                <div className="ef-section-header">
                                    <Strategy size={24} color={colors.secondary} />
                                    <h3>FORMAÇÃO</h3>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
                                    {Object.keys(FORMATIONS).map(f => (
                                        <EfButton key={f} variant={team.formation === f ? 'primary' : 'secondary'}
                                            onClick={() => { engine.setFormation(f); forceUpdate(); }}>{f}</EfButton>
                                    ))}
                                </div>

                                <div className="ef-section-header">
                                    <Shield size={24} color={colors.accent} />
                                    <h3>ESTILO TÁTICO</h3>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    {Object.entries(TACTICS).map(([k, v]) => (
                                        <EfButton key={k} variant={engine.currentTactic === k ? 'primary' : 'secondary'}
                                            onClick={() => { engine.setTactic(k); forceUpdate(); }}>{v.name}</EfButton>
                                    ))}
                                </div>
                                <p className="ef-sans ef-text-muted" style={{ fontSize: '0.85rem', marginTop: '12px', backgroundColor: colors.panelElevated, padding: '12px', borderLeft: `4px solid ${colors.secondary}` }}>
                                    {TACTICS[engine.currentTactic]?.description}
                                </p>
                            </EfPanel>

                            <EfPanel padding="md">
                                <div className="ef-section-header">
                                    <Megaphone size={24} color={colors.warning} />
                                    <h3>PRELEÇÃO</h3>
                                </div>
                                {talkDone ? (
                                    <div className="ef-sans ef-text-primary" style={{ backgroundColor: '#1B4332', padding: '16px', border: `1px solid ${colors.accent}`, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <CheckCircle size={24} /> PRELEÇÃO REALIZADA COM SUCESSO!
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                                        {TEAM_TALKS.map(t => (
                                            <EfButton key={t.id} variant="secondary" onClick={() => { engine.doTeamTalk(t.id); setTalkDone(true); forceUpdate(); }}>
                                                {t.name}
                                            </EfButton>
                                        ))}
                                    </div>
                                )}
                            </EfPanel>

                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                                <EfButton variant="secondary" onClick={() => setPreStep(1)}>
                                    <ArrowLeft size={16} /> VOLTAR: ESCALAÇÃO
                                </EfButton>
                                <EfButton variant="primary" onClick={() => setPreStep(3)}>
                                    PRÓXIMO: CONFIRMAR <CheckCircle size={16} />
                                </EfButton>
                            </div>
                        </div>
                    )}

                    {preStep === 3 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                            <EfPanel padding="lg" style={{ textAlign: 'center', border: `2px solid ${colors.secondary}` }}>
                                <EfClubBadge name={team.name} size="xl" style={{ margin: '0 auto 16px' }} />
                                <h2 className="ef-sans ef-text-main" style={{ fontSize: '1.8rem', margin: '0 0 8px 0' }}>{team.name}</h2>
                                <div className="ef-mono" style={{ display: 'inline-flex', gap: '12px', marginBottom: '24px' }}>
                                    <span className="ef-text-primary" style={{ backgroundColor: colors.panelElevated, padding: '6px 16px', border: `1px solid ${colors.border}` }}>{team.formation}</span>
                                    <span className="ef-text-info" style={{ backgroundColor: colors.panelElevated, padding: '6px 16px', border: `1px solid ${colors.border}` }}>{tactic?.name}</span>
                                </div>

                                {cond && <div className="ef-sans ef-text-info" style={{ display: 'inline-block', backgroundColor: '#111417', border: `1px solid ${colors.secondary}`, padding: '8px 16px', fontSize: '0.9rem', marginBottom: '24px', fontWeight: 'bold' }}>CONDIÇÃO: {cond.name}</div>}

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', justifyContent: 'center', maxWidth: '600px', margin: '0 auto 24px' }}>
                                    <div style={{ backgroundColor: colors.panelElevated, padding: '16px', border: `1px solid ${colors.border}` }}><div className="ef-sector-cell__value ef-sector-cell__value--lg ef-text-accent">{sectors.goalkeeper}</div><div className="ef-sector-cell__label">GOL</div></div>
                                    <div style={{ backgroundColor: colors.panelElevated, padding: '16px', border: `1px solid ${colors.border}` }}><div className="ef-sector-cell__value ef-sector-cell__value--lg ef-text-info">{sectors.defense}</div><div className="ef-sector-cell__label">DEF</div></div>
                                    <div style={{ backgroundColor: colors.panelElevated, padding: '16px', border: `1px solid ${colors.border}` }}><div className="ef-sector-cell__value ef-sector-cell__value--lg ef-text-primary">{sectors.midfield}</div><div className="ef-sector-cell__label">MEI</div></div>
                                    <div style={{ backgroundColor: colors.panelElevated, padding: '16px', border: `1px solid ${colors.border}` }}><div className="ef-sector-cell__value ef-sector-cell__value--lg ef-text-danger">{sectors.attack}</div><div className="ef-sector-cell__label">ATA</div></div>
                                </div>

                                <div className={`ef-sans ${talkDone ? 'ef-text-primary' : 'ef-text-accent'}`} style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                    {talkDone ? <><CheckCircle size={20} /> PRELEÇÃO CONFIRMADA</> : <><Warning size={20} /> ATENÇÃO: SEM PRELEÇÃO REALIZADA</>}
                                </div>
                            </EfPanel>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <EfButton variant="primary" style={{ padding: '20px', fontSize: '1.2rem', justifyContent: 'center' }} onClick={launchMatch}>
                                    <SoccerBall size={24} weight="fill" /> INICIAR PARTIDA
                                </EfButton>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <EfButton variant="secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setPreStep(2)}>
                                        <ArrowLeft size={16} /> VOLTAR: TÁTICA
                                    </EfButton>
                                    <EfButton variant="secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => changeView(getDashboardView())}>
                                        CANCELAR E VOLTAR
                                    </EfButton>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const runningScore = getDisplayScore();

    // === SCOREBOARD ===
    const Scoreboard = ({ half }) => (
        <EfPanel padding="md" style={{ position: 'relative', marginBottom: '24px', overflow: 'hidden', border: `2px solid ${colors.border}` }}>
            {goalBurstActive && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#1B4332', animation: 'pulse 1s infinite', pointerEvents: 'none', zIndex: 1 }} />
            )}

            <div className="ef-sans ef-text-accent" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 'bold', position: 'relative', zIndex: 2 }}>
                <div style={{ flex: 1, textAlign: 'right', letterSpacing: '0.1em' }}>MANDANTE</div>
                <div className="ef-mono ef-text-primary" style={{ backgroundColor: colors.bg, padding: '6px 12px', border: `1px solid ${colors.border}` }}>
                    {half}
                </div>
                <div style={{ flex: 1, textAlign: 'left', letterSpacing: '0.1em' }}>VISITANTE</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '16px', position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <EfClubBadge name={result.home} size="xl" />
                    <span className="ef-sans ef-text-main" style={{ fontSize: '1rem', fontWeight: 'bold', textAlign: 'center' }}>{result.home}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div className="ef-score-box">
                        <div className="ef-score-box__num">{runningScore.home}</div>
                        <div className="ef-score-box__sep">-</div>
                        <div className="ef-score-box__num">{runningScore.away}</div>
                    </div>

                    <div className="ef-clock">
                        <span className={`ef-clock__time${isPlaying ? ' ef-clock__time--playing' : ''}`}>
                            {String(currentMinute).padStart(2, '0')}:00
                        </span>
                        {isPlaying && <div className="ef-clock__dot" />}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <EfClubBadge name={result.away} size="xl" />
                    <span className="ef-sans ef-text-main" style={{ fontSize: '1rem', fontWeight: 'bold', textAlign: 'center' }}>{result.away}</span>
                </div>
            </div>
        </EfPanel>
    );

    // === LIVE MATCH RENDERER ===
    const renderLiveMatch = (half) => (
        <div className="ef-view-shell">
            {/* SPEC-B2.2: mid-match decision overlay */}
            <MidMatchCardModal
                card={midMatchCard}
                onChoose={handleMidMatchChoose}
                onClose={() => setMidMatchCard(null)}
            />
            <div className="ef-view-container">
                <Scoreboard half={half} />

                <EfPanel padding="md" className="ef-match-pitch-bg" style={{ height: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }} scrollRef={logRef}>
                    {displayedEvents.map((n, i) => {
                        const isGoal = n.text?.includes('⚽');
                        const isCard = n.text?.includes('🟨') || n.text?.includes('🟥');
                        const isSub = n.text?.includes('🔄');
                        const isInjury = n.text?.includes('🤕');

                        let rowMod = '';
                        if (isGoal) rowMod = ' ef-match-log-row--goal';
                        else if (isCard) rowMod = ' ef-match-log-row--card';
                        else if (isSub) rowMod = ' ef-match-log-row--sub';
                        else if (isInjury) rowMod = ' ef-match-log-row--injury';

                        return (
                            <div key={i} className={`ef-match-log-row${rowMod}`}>
                                <div className="ef-match-log-row__min">{n.minute}'</div>
                                <div style={{ flex: 1 }}>{n.text}</div>
                            </div>
                        );
                    })}
                </EfPanel>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '8px', backgroundColor: colors.panelElevated, padding: '8px', border: `1px solid ${colors.border}` }}>
                        <EfButton size="md" variant={!paused && speed === 400 ? 'primary' : 'secondary'} onClick={() => { setSpeed(400); setPaused(false); pausedRef.current = false; }}>1x</EfButton>
                        <EfButton size="md" variant={!paused && speed === 200 ? 'primary' : 'secondary'} onClick={() => { setSpeed(200); setPaused(false); pausedRef.current = false; }}>2x</EfButton>
                        <EfButton size="md" variant={!paused && speed === 80 ? 'primary' : 'secondary'} onClick={() => { setSpeed(80); setPaused(false); pausedRef.current = false; }}>5x</EfButton>
                        <EfButton size="md" variant={paused ? 'primary' : 'secondary'} onClick={() => { const next = !paused; setPaused(next); pausedRef.current = next; if (next) setLiveModalOpen(true); }}>
                            {paused ? <Play weight="fill" /> : <Pause weight="fill" />} {paused ? 'RETOMAR' : 'PAUSAR / TÁTICA'}
                        </EfButton>
                    </div>
                    <EfButton size="md" variant="secondary" onClick={() => skipToEnd(narration, half === '1º TEMPO' ? 45 : 90, null)}>
                        PULAR <FastForward weight="fill" />
                    </EfButton>
                </div>

                {half === '1º TEMPO' ? (
                    <EfButton variant="primary" style={{ padding: '16px', fontSize: '1.1rem', justifyContent: 'center' }} disabled={isPlaying} onClick={() => setPhase('halftime')}>
                        <Pause weight="fill" /> INTERVALO
                    </EfButton>
                ) : (
                    <EfButton variant="primary" style={{ padding: '16px', fontSize: '1.1rem', justifyContent: 'center' }} disabled={isPlaying} onClick={() => setPhase('fulltime')}>
                        <CheckCircle weight="fill" /> FIM DE JOGO
                    </EfButton>
                )}

                {liveModalOpen && (
                    <LiveSquadEditModal
                        team={team}
                        engine={engine}
                        currentMinute={currentMinute}
                        liveSubsCount={liveSubsCount}
                        onSubMade={() => { setLiveSubsCount(c => c + 1); forceUpdate(); }}
                        onClose={() => { setLiveModalOpen(false); setPaused(false); pausedRef.current = false; }}
                    />
                )}
            </div>
        </div>
    );

    if (phase === 'firsthalf') return renderLiveMatch('1º TEMPO');
    if (phase === 'secondhalf') return renderLiveMatch('2º TEMPO');

    // === HALF TIME ===
    if (phase === 'halftime') {
        const subs = team.squad.filter(p => !p.isTitular && !p.injury).slice(0, 5);
        const tiredPlayers = team.squad.filter(p => p.isTitular && p.energy < 50);

        return (
            <div className="ef-view-shell">
                <div className="ef-view-container">
                    <EfPanel padding="lg" style={{ textAlign: 'center', border: `2px solid ${colors.secondary}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
                            <Pause size={32} color={colors.warning} weight="fill" />
                            <h2 className="ef-sans ef-text-main" style={{ fontSize: '1.8rem', margin: 0 }}>INTERVALO</h2>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <EfClubBadge name={result.home} size="lg" />
                                <span className="ef-sans ef-text-main" style={{ fontSize: '1rem', fontWeight: 'bold' }}>{result.home}</span>
                            </div>
                            <div className="ef-score-box ef-score-box--sm" style={{ backgroundColor: colors.panelElevated }}>
                                <div className="ef-score-box__num ef-score-box__num--md">{halfTimeData?.homeGoals ?? 0}</div>
                                <div className="ef-score-box__sep ef-score-box__sep--sm">-</div>
                                <div className="ef-score-box__num ef-score-box__num--md">{halfTimeData?.awayGoals ?? 0}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <EfClubBadge name={result.away} size="lg" />
                                <span className="ef-sans ef-text-main" style={{ fontSize: '1rem', fontWeight: 'bold' }}>{result.away}</span>
                            </div>
                        </div>
                    </EfPanel>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                        {!tacticChanged && (
                            <EfPanel padding="md">
                                <div className="ef-section-header">
                                    <Strategy size={24} color={colors.secondary} />
                                    <h3>AJUSTE TÁTICO</h3>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    {Object.entries(TACTICS).map(([k, v]) => (
                                        <EfButton key={k} variant={engine.currentTactic === k ? 'primary' : 'secondary'}
                                            onClick={() => { engine.setTactic(k); setTacticChanged(true); forceUpdate(); }}>
                                            {v.name}
                                        </EfButton>
                                    ))}
                                </div>
                            </EfPanel>
                        )}

                        {!subUsed && tiredPlayers.length > 0 && subs.length > 0 && (
                            <EfPanel padding="md">
                                <div className="ef-section-header">
                                    <ArrowsLeftRight size={24} color={colors.warning} />
                                    <h3>SUBSTITUIÇÃO (CANSAÇO)</h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {tiredPlayers.slice(0, 3).map(p => (
                                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: colors.panelElevated, border: `1px solid ${colors.border}` }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div className="ef-sans ef-text-main" style={{ fontWeight: 'bold' }}>{p.name} <span className="ef-text-muted" style={{ fontSize: '0.8rem' }}>({p.position})</span></div>
                                                <div className="ef-mono" style={{ color: getEnergyColor(p.energy), fontSize: '0.85rem' }}>COND: {p.energy}%</div>
                                            </div>
                                            <EfButton variant="primary" size="sm" onClick={() => {
                                                const sub = subs[0];
                                                if (sub) {
                                                    p.isTitular = false;
                                                    sub.isTitular = true;
                                                    sub.energy = Math.min(100, sub.energy + 15);
                                                    setSubUsed(true);
                                                    forceUpdate();
                                                }
                                            }}>
                                                <ArrowsLeftRight size={16} /> ENTRA {subs[0]?.name}
                                            </EfButton>
                                        </div>
                                    ))}
                                </div>
                            </EfPanel>
                        )}
                    </div>

                    <EfButton variant="primary" style={{ padding: '20px', fontSize: '1.2rem', justifyContent: 'center' }} onClick={() => {
                        setPhase('secondhalf');
                        setTimeout(() => startLiveTicker(narration, 46, 90, null), 300);
                    }}>
                        <Play size={24} weight="fill" /> INICIAR 2º TEMPO
                    </EfButton>
                </div>
            </div>
        );
    }

    // === FULL TIME ===
    const lastMatchScorers = narration.filter(n => n && n.text?.includes('⚽'));
    const lastMatchCards = narration.filter(n => n && n.text?.includes('🟨') || n?.text?.includes('🟥'));
    const motmEntry = narration.find(n => n.text?.includes('⭐ Craque'));

    return (
        <div className="ef-view-shell">
            <div className="ef-view-container">
                {banner && <EfBanner type={banner} onDismiss={() => setBanner(null)} />}

                <EfPanel padding="lg" style={{ textAlign: 'center', border: `2px solid ${colors.secondary}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
                        <CheckCircle size={32} color={colors.accent} weight="fill" />
                        <h2 className="ef-sans ef-text-main" style={{ fontSize: '1.8rem', margin: 0 }}>FIM DE JOGO</h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <EfClubBadge name={result?.home} size="xl" />
                            <span className="ef-sans ef-text-main" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{result?.home}</span>
                        </div>
                        <div className="ef-score-box" style={{ backgroundColor: colors.panelElevated }}>
                            <div className="ef-score-box__num">{result?.homeGoals}</div>
                            <div className="ef-score-box__sep">-</div>
                            <div className="ef-score-box__num">{result?.awayGoals}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <EfClubBadge name={result?.away} size="xl" />
                            <span className="ef-sans ef-text-main" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{result?.away}</span>
                        </div>
                    </div>
                    {motmEntry && (
                        <div className="ef-sans ef-text-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#1B4332', padding: '12px 24px', border: `1px solid ${colors.warning}`, fontWeight: 'bold' }}>
                            <ChartBar size={20} weight="fill" /> {motmEntry.text}
                        </div>
                    )}
                </EfPanel>

                {/* SPEC-A4: Match Post-Mortem painel decisão */}
                {result && (
                    <MatchPostMortem
                        analysis={analyzeMatch({
                            result: {
                                home: result.home,
                                away: result.away,
                                homeGoals: result.homeGoals,
                                awayGoals: result.awayGoals,
                                isHomeTeam: engine.getTeam(gameState.teamId)?.name === result.home,
                            },
                            tacticUsed: engine.tactic || 'Normal',
                            formationUsed: engine.getTeam(gameState.teamId)?.formation || '4-3-3',
                            opponentStyle: result.opponentStyle || 'Normal',
                            recentForm: engine.managerStats?.rollingForm?.slice(-5) || [],
                            subsUsed: result.subsUsed || 0,
                        })}
                    />
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    <EfPanel padding="md">
                        <div className="ef-section-header">
                            <SoccerBall size={24} color={colors.text} />
                            <h3>GOLS & EVENTOS</h3>
                        </div>
                        {lastMatchScorers.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {lastMatchScorers.map((s, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: colors.panelElevated, border: `1px solid ${colors.border}` }}>
                                        <div className="ef-mono ef-text-primary" style={{ fontWeight: 'bold', minWidth: '40px' }}>{s.minute}'</div>
                                        <div className="ef-sans ef-text-main" style={{ fontSize: '0.9rem' }}>{s.text}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="ef-sans ef-text-muted" style={{ fontSize: '0.9rem', padding: '12px', textAlign: 'center', backgroundColor: colors.panelElevated }}>
                                Nenhum gol na partida.
                            </div>
                        )}
                    </EfPanel>

                    <EfPanel padding="md">
                        <div className="ef-section-header">
                            <ChartBar size={24} color={colors.secondary} />
                            <h3>ESTATÍSTICAS DA PARTIDA</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className="ef-stat-line">
                                <span className="ef-stat-line__label">Finalizações</span>
                                <strong className="ef-stat-line__value">{matchStats?.totalChances || 0}</strong>
                            </div>
                            <div className="ef-stat-line">
                                <span className="ef-stat-line__label">Tática Utilizada</span>
                                <strong className="ef-sans ef-text-main">{TACTICS[engine.currentTactic]?.name}</strong>
                            </div>
                            <div className="ef-stat-line">
                                <span className="ef-stat-line__label"><Cardholder color={colors.warning} weight="fill" /> Cartões</span>
                                <strong className="ef-stat-line__value">{lastMatchCards.length}</strong>
                            </div>
                            <div className="ef-stat-line">
                                <span className="ef-stat-line__label"><FirstAid color={colors.danger} weight="fill" /> Lesões</span>
                                <strong className="ef-stat-line__value">{matchStats?.injuries || 0}</strong>
                            </div>
                        </div>
                    </EfPanel>

                    {engine.board && (
                        <EfPanel padding="md">
                            <div className="ef-section-header">
                                <Shield size={24} color={engine.board.getStatus().color} />
                                <h3>STATUS DA DIRETORIA</h3>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: colors.panelElevated, border: `1px solid ${engine.board.getStatus().color}` }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div className="ef-sans ef-text-muted" style={{ fontSize: '0.85rem' }}>Confiança</div>
                                    <div className="ef-sans" style={{ color: engine.board.getStatus().color, fontWeight: 'bold', fontSize: '1.1rem' }}>{engine.board.getStatus().label}</div>
                                </div>
                                <div className="ef-mono" style={{ fontSize: '2rem', fontWeight: 'bold', color: engine.board.getStatus().color }}>
                                    {engine.board.confidence}%
                                </div>
                            </div>
                        </EfPanel>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <EfButton variant="primary" style={{ justifyContent: 'center', flex: 1, padding: '16px', fontSize: '1.1rem' }} onClick={() => { setPhase('prematch'); setResult(null); setNarration([]); setDisplayedEvents([]); setCurrentMinute(0); setSubUsed(false); setTacticChanged(false); setPreStep(1); setTalkDone(false); changeView(getDashboardView()); }}>
                        <ChartBar size={20} /> VOLTAR AO DASHBOARD
                    </EfButton>
                    <EfButton variant="secondary" style={{ justifyContent: 'center', flex: 1, padding: '16px', fontSize: '1.1rem' }} onClick={() => { setPhase('prematch'); setResult(null); setNarration([]); setDisplayedEvents([]); setCurrentMinute(0); setSubUsed(false); setTacticChanged(false); setPreStep(1); setTalkDone(false); changeView('press'); }}>
                        <MicrophoneStage size={20} /> COLETIVA PÓS-JOGO
                    </EfButton>
                </div>
            </div>
        </div>
    );
}

export default MatchView;
