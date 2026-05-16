import { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { TACTICS, FORMATIONS, TEAM_TALKS } from '../engine/ManagerSystems';
import { getFormEmoji } from '../engine/PlayerDevelopment';
import { sfx } from '../utils/sound';
import { LiveSquadEditModal } from './LiveSquadEditModal';
import { PreMatchScreen } from './PreMatchScreen';
import { EfClubBadge, EfBanner } from './ui';
import RivalriesView from './RivalriesView';
import AutoPlayLabView from './AutoPlayLabView';
import MatchHighlightVideo from './MatchHighlightVideo';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';
import { rng as systemRng } from '../engine/rng.js';
import { shouldTriggerMidMatch, getMidMatchCardDerbyAware } from '../engine/MidMatchManagerDeck';
import MidMatchCardModal from './MidMatchCardModal';
import StarImpactToast from './StarImpactToast';

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
    const [eventOverlay, setEventOverlay] = useState(null);
    const [banner, setBanner] = useState(null);
    const [firstHalfResult, setFirstHalfResult] = useState(null);
    const [activeMidMatchCard, setActiveMidMatchCard] = useState(null);
    const [starImpacts, setStarImpacts] = useState([]);
    const [benchPlayers, setBenchPlayers] = useState(() => {
        // Smart bench: 1 GOL + positions based on current formation
        const reserves = (team?.squad || []).filter(p => !p.isTitular && !p.injury && !p.suspension);
        const bench = [];
        
        // 1. Always pick a backup GK
        const gkReserve = reserves.find(p => p.position === 'GOL');
        if (gkReserve) bench.push(gkReserve.id);
        
        // 2. Fill remaining 4 slots based on formation needs
        const formation = FORMATIONS[team?.formation] || FORMATIONS['4-3-3'];
        const posNeeds = [
            ...Array(Math.max(1, Math.floor(formation.DEF / 2))).fill('DEF'),
            ...Array(Math.max(1, Math.floor(formation.MEI / 2))).fill('MEI'),
            ...Array(Math.max(1, Math.floor(formation.ATA / 2))).fill('ATA'),
        ];
        
        const remaining = reserves.filter(p => !bench.includes(p.id));
        for (const pos of posNeeds) {
            if (bench.length >= 5) break;
            const candidate = remaining
                .filter(p => p.position === pos && !bench.includes(p.id))
                .sort((a, b) => b.ovr - a.ovr)[0];
            if (candidate) bench.push(candidate.id);
        }
        
        // 3. Fill any remaining slots with best available
        const leftover = remaining.filter(p => !bench.includes(p.id)).sort((a, b) => b.ovr - a.ovr);
        for (const p of leftover) {
            if (bench.length >= 5) break;
            bench.push(p.id);
        }
        
        return bench;
    });
    
    const logRef = useRef(null);
    const timerRef = useRef(null);
    const speedRef = useRef(200);
    const pausedRef = useRef(false);
    const matchIdsRef = useRef(null); // { homeId, awayId, isCup } for split-sim
    const midMatchTriggeredRef = useRef(new Set());

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

    const getEnergyColor = (e) => {
        if (e < 40) return 'var(--color-danger)';
        if (e < 70) return 'var(--color-secondary)';
        return 'var(--color-primary)';
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

                if (shouldTriggerMidMatch(min + 1, midMatchTriggeredRef.current) && systemRng() < 0.4) {
                    const isDerby = engine.getMatchContext ? engine.getMatchContext().isDerby : false;
                    const card = getMidMatchCardDerbyAware(min + 1, isDerby, Math.floor(systemRng() * 10000));
                    if (card) {
                        setPaused(true);
                        pausedRef.current = true;
                        setActiveMidMatchCard(card);
                        midMatchTriggeredRef.current.add(min + 1);
                        return;
                    }
                }

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

            if (shouldTriggerMidMatch(min + 1, midMatchTriggeredRef.current) && systemRng() < 0.4) {
                const isDerby = engine.getMatchContext ? engine.getMatchContext().isDerby : false;
                const card = getMidMatchCardDerbyAware(min + 1, isDerby, Math.floor(systemRng() * 10000));
                if (card) {
                    setPaused(true);
                    pausedRef.current = true;
                    setActiveMidMatchCard(card);
                    midMatchTriggeredRef.current.add(min + 1);
                    return;
                }
            }

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


    // TRUNCATE BASE RESULT (so we don't double count goals when resimulating)
    const truncateSimResult = (baseResult, min) => {
        if (!baseResult) return null;
        
        const textLog = baseResult.events.textLog.filter(e => e && e.minute <= min);
        const _rawEvents = baseResult.events._rawEvents.filter(e => e && e.minute <= min);
        const home = baseResult.events.home.filter(e => e && e.minute <= min);
        const away = baseResult.events.away.filter(e => e && e.minute <= min);
        
        const homeGoals = home.filter(e => e?.text?.includes('⚽')).length;
        const awayGoals = away.filter(e => e?.text?.includes('⚽')).length;

        return {
            ...baseResult,
            homeGoals,
            awayGoals,
            events: {
                ...baseResult.events,
                textLog,
                _rawEvents,
                home,
                away,
                scorers: baseResult.events.scorers.filter(e => e && (e.minute || 0) <= min),
                cards: baseResult.events.cards.filter(e => e && (e.minute || 0) <= min)
            }
        };
    };

    // === PRE-MATCH ===
    if (phase === 'prematch') {
        const titulares = team.squad.filter(p => p.isTitular && !p.injury);
        const lowEnergy = titulares.filter(p => p.energy < 40);
        const sectors = engine.getTeamSectors(team.id);

        const launchMatch = () => {
            try {
                // SPLIT-SIM: Find the human match BEFORE advanceWeek
                const pending = engine.getPendingHumanMatch();
                if (!pending) {
                    // No match this week — advance and show "no game"
                    engine.advanceWeek();
                    setResult({ home: team.name, away: 'Sem Jogo', homeGoals: '-', awayGoals: '-' });
                    setPhase('fulltime');
                    forceUpdate();
                    return;
                }

                const { match, isCup } = pending;
                const homeId = match.home;
                const awayId = match.away;
                const isHome = homeId === team.id;
                const opponent = engine.getTeam(isHome ? awayId : homeId);

                // Store match IDs for second-half re-simulation
                matchIdsRef.current = { homeId, awayId, isCup };

                // PHASE 1: Simulate ONLY the first half (minutes 1-45)
                const htResult = engine.playMatchFirstHalf(homeId, awayId, isCup);
                setFirstHalfResult(htResult);

                const htEvents = htResult.events?.textLog || [];
                const htHomeGoals = isHome ? htResult.homeGoals : htResult.awayGoals;
                const htAwayGoals = isHome ? htResult.awayGoals : htResult.homeGoals;

                setResult({
                    home: isHome ? team.name : opponent.name,
                    away: isHome ? opponent.name : team.name,
                    homeGoals: htHomeGoals,
                    awayGoals: htAwayGoals,
                    _baseSimResult: htResult,
                    _matchRef: match,
                });
                setNarration(htEvents);
                setHalfTimeData({ homeGoals: htHomeGoals, awayGoals: htAwayGoals });

                setDisplayedEvents([]);
                setCurrentMinute(0);
                setPhase('firsthalf');
                setTimeout(() => startLiveTicker(htEvents, 0, 45, null), 300);
                forceUpdate();
            } catch (err) {
                console.error('[ELIFOOT] launchMatch crash:', err);
                console.error(err.stack);
                // Fallback: show error state
                setResult({ home: team.name, away: err.message.slice(0, 15) || 'ERRO', homeGoals: '!', awayGoals: '!' });
                setPhase('fulltime');
                forceUpdate();
            }
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

                    <EfPanel className="ef-match-prematch__steps" padding="md">
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
                        <div className="ef-match-prematch__step1">
                            <EfPanel padding="md">
                                <div className="ef-section-header">
                                    <ListNumbers size={24} style={{ color: 'var(--color-secondary)' }} />
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
                                <div className="ef-match-prematch__starters-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div className="ef-section-header" style={{ marginBottom: 0 }}>
                                        <UserList size={24} style={{ color: 'var(--notification-info-border)' }} />
                                        <h3>TITULARES ({titulares.length})</h3>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <EfButton variant="secondary" size="sm" onClick={() => {
                                            const res = engine.autoPickSquad();
                                            if (res.success) setBenchPlayers(res.bench);
                                        }}>
                                            <Strategy size={16} /> AUTO-ESCALAR
                                        </EfButton>
                                        <EfButton variant="primary" size="sm" onClick={() => setLiveModalOpen(true)}>
                                            <ArrowsLeftRight size={16} /> SUBSTITUIR
                                        </EfButton>
                                    </div>
                                </div>
                                {lowEnergy.length > 0 && (
                                    <div className="ef-match-prematch__low-energy" style={{ marginBottom: '16px' }}>
                                        <Warning /> {lowEnergy.length} COM ENERGIA BAIXA
                                    </div>
                                )}
                                <div className="ef-match-prematch__starters-list">
                                    {titulares.map(p => (
                                        <div key={p.id} className={`ef-match-prematch__starter${p.energy < 40 ? ' ef-match-prematch__starter--low-energy' : ''}`}>
                                            <div className="ef-match-prematch__starter-left">
                                                <div className="ef-match-prematch__starter-pos">
                                                    {p.position}
                                                </div>
                                                <div className="ef-match-prematch__starter-name">
                                                    {p.name} {p._isCaptain && '©️'} {getFormEmoji(p.form?.trend)}
                                                </div>
                                            </div>
                                            <div className="ef-match-prematch__starter-right">
                                                <div className="ef-text-main">OVR: {p.ovr}</div>
                                                <div className="ef-match-prematch__starter-energy" style={{ color: getEnergyColor(p.energy) }}>COND: {p.energy}%</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </EfPanel>

                            {/* === BANCO DE RESERVAS (5 jogadores) === */}
                            <EfPanel padding="md">
                                <div className="ef-section-header">
                                    <ArrowsLeftRight size={24} style={{ color: 'var(--color-secondary)' }} />
                                    <h3>BANCO DE RESERVAS ({benchPlayers.length}/5)</h3>
                                </div>

                                {(() => {
                                    const benchList = benchPlayers.map(id => team.squad.find(p => p.id === id)).filter(Boolean);
                                    const availableForBench = team.squad.filter(p => !p.isTitular && !p.injury && !p.suspension && !benchPlayers.includes(p.id)).sort((a, b) => b.ovr - a.ovr);

                                    return (
                                        <>
                                            {benchList.length > 0 && (
                                                <div className="ef-match-prematch__starters-list">
                                                    {benchList.map(p => (
                                                        <div key={p.id} className="ef-match-prematch__starter">
                                                            <div className="ef-match-prematch__starter-left">
                                                                <div className="ef-match-prematch__starter-pos">{p.position}</div>
                                                                <div className="ef-match-prematch__starter-name-block">
                                                                    <div className="ef-match-prematch__starter-name">
                                                                        {p.name} {p._isCaptain && '©️'} {getFormEmoji(p.form?.trend)}
                                                                    </div>
                                                                    <div className="ef-match-prematch__starter-detail">
                                                                        OVR: <strong>{p.ovr}</strong> • 
                                                                        <span style={{ color: getEnergyColor(p.energy) }}> COND: {p.energy}%</span> • 
                                                                        Moral: {p.moral || 50}% • 
                                                                        {p.age} anos
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <EfButton variant="secondary" size="sm" onClick={() => setBenchPlayers(prev => prev.filter(id => id !== p.id))}>
                                                                ✖ REMOVER
                                                            </EfButton>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {benchPlayers.length < 5 && availableForBench.length > 0 && (
                                                <>
                                                    <div className="ef-match-prematch__low-energy" style={{ marginTop: '12px', color: 'var(--text-muted)' }}>
                                                        ADICIONAR AO BANCO:
                                                    </div>
                                                    <div className="ef-match-prematch__starters-list">
                                                        {availableForBench.slice(0, 10).map(p => (
                                                            <div key={p.id} className="ef-match-prematch__starter" style={{ opacity: 0.7 }}>
                                                                <div className="ef-match-prematch__starter-left">
                                                                    <div className="ef-match-prematch__starter-pos">{p.position}</div>
                                                                    <div className="ef-match-prematch__starter-name-block">
                                                                        <div className="ef-match-prematch__starter-name">
                                                                            {p.name} {getFormEmoji(p.form?.trend)}
                                                                        </div>
                                                                        <div className="ef-match-prematch__starter-detail">
                                                                            OVR: <strong>{p.ovr}</strong> • 
                                                                            <span style={{ color: getEnergyColor(p.energy) }}> COND: {p.energy}%</span> • 
                                                                            Moral: {p.moral || 50}% • 
                                                                            {p.age} anos
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <EfButton variant="primary" size="sm" onClick={() => setBenchPlayers(prev => [...prev, p.id])}>
                                                                    + BANCO
                                                                </EfButton>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}

                                            {benchList.length === 0 && (
                                                <div className="ef-sans ef-text-muted" style={{ padding: '12px', textAlign: 'center' }}>
                                                    Nenhum jogador selecionado para o banco.
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </EfPanel>

                            <div className="ef-match-prematch__actions">
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
                        <div className="ef-match-prematch__step2">
                            <EfPanel padding="md">
                                <div className="ef-section-header">
                                    <Strategy size={24} style={{ color: 'var(--notification-info-border)' }} />
                                    <h3>FORMAÇÃO</h3>
                                </div>
                                <div className="ef-match-prematch__formation-buttons">
                                    {Object.keys(FORMATIONS).map(f => (
                                        <EfButton key={f} variant={team.formation === f ? 'primary' : 'secondary'}
                                            onClick={() => { engine.setFormation(f); forceUpdate(); }}>{f}</EfButton>
                                    ))}
                                </div>

                                <div className="ef-section-header">
                                    <Shield size={24} style={{ color: 'var(--color-primary)' }} />
                                    <h3>ESTILO TÁTICO</h3>
                                </div>
                                <div className="ef-match-prematch__tactic-buttons">
                                    {Object.entries(TACTICS).map(([k, v]) => (
                                        <EfButton key={k} variant={engine.currentTactic === k ? 'primary' : 'secondary'}
                                            onClick={() => { engine.setTactic(k); forceUpdate(); }}>{v.name}</EfButton>
                                    ))}
                                </div>
                                <p className="ef-match-prematch__tactic-desc">
                                    {TACTICS[engine.currentTactic]?.description}
                                </p>
                            </EfPanel>

                            <EfPanel padding="md">
                                <div className="ef-section-header">
                                    <Megaphone size={24} style={{ color: 'var(--color-secondary)' }} />
                                    <h3>PRELEÇÃO</h3>
                                </div>
                                {talkDone ? (
                                    <div className="ef-match-prematch__talk-done">
                                        <CheckCircle size={24} /> PRELEÇÃO REALIZADA COM SUCESSO!
                                    </div>
                                ) : (
                                    <div className="ef-match-prematch__talk-buttons">
                                        {TEAM_TALKS.map(t => (
                                            <EfButton key={t.id} variant="secondary" onClick={() => { engine.doTeamTalk(t.id); setTalkDone(true); forceUpdate(); }}>
                                                {t.name}
                                            </EfButton>
                                        ))}
                                    </div>
                                )}
                            </EfPanel>

                            <div className="ef-match-prematch__actions">
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
                        <div className="ef-match-prematch__step3">
                            <EfPanel className="ef-match-prematch__confirm-panel" padding="lg">
                                <EfClubBadge name={team.name} size="xl" style={{ margin: '0 auto 16px' }} />
                                <h2 className="ef-match-prematch__team-name">{team.name}</h2>
                                <div className="ef-match-prematch__confirm-info">
                                    <span className="ef-text-primary">{team.formation}</span>
                                    <span className="ef-text-info">{tactic?.name}</span>
                                </div>

                                {cond && <div className="ef-match-prematch__condition">CONDIÇÃO: {cond.name}</div>}

                                <div className="ef-match-prematch__sectors-grid">
                                    <div className="ef-match-prematch__sector"><div className="ef-sector-cell__value ef-sector-cell__value--lg ef-text-accent">{sectors.goalkeeper}</div><div className="ef-sector-cell__label">GOL</div></div>
                                    <div className="ef-match-prematch__sector"><div className="ef-sector-cell__value ef-sector-cell__value--lg ef-text-info">{sectors.defense}</div><div className="ef-sector-cell__label">DEF</div></div>
                                    <div className="ef-match-prematch__sector"><div className="ef-sector-cell__value ef-sector-cell__value--lg ef-text-primary">{sectors.midfield}</div><div className="ef-sector-cell__label">MEI</div></div>
                                    <div className="ef-match-prematch__sector"><div className="ef-sector-cell__value ef-sector-cell__value--lg ef-text-danger">{sectors.attack}</div><div className="ef-sector-cell__label">ATA</div></div>
                                </div>

                                <div className={`ef-match-prematch__talk-status${talkDone ? ' ef-match-prematch__talk-status--done' : ''}`}>
                                    {talkDone ? <><CheckCircle size={20} /> PRELEÇÃO CONFIRMADA</> : <><Warning size={20} /> ATENÇÃO: SEM PRELEÇÃO REALIZADA</>}
                                </div>
                            </EfPanel>

                            <div className="ef-match-prematch__launch-buttons">
                                <EfButton variant="primary" style={{ padding: '20px', fontSize: '1.2rem', justifyContent: 'center' }} onClick={launchMatch}>
                                    <SoccerBall size={24} weight="fill" /> INICIAR PARTIDA
                                </EfButton>
                                <div className="ef-match-prematch__launch-actions">
                                    <EfButton variant="secondary" onClick={() => setPreStep(2)}>
                                        <ArrowLeft size={16} /> VOLTAR: TÁTICA
                                    </EfButton>
                                    <EfButton variant="secondary" onClick={() => changeView(getDashboardView())}>
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

    // === SCOREBOARD === (Stitch v1.1: top scoreboard w/ progress bar)
    const Scoreboard = ({ half }) => {
        // Match progress: 0-90' linear (45' = halftime marker)
        const progressPct = Math.min(100, Math.round((currentMinute / 90) * 100));
        return (
            <EfPanel className="ef-match-scoreboard" padding="md">
                {goalBurstActive && (
                    <div className="ef-match-scoreboard__goal-burst" />
                )}

                <div className="ef-match-scoreboard__header">
                    <div>MANDANTE</div>
                    <div className="ef-mono ef-text-primary">
                        {half}
                    </div>
                    <div>VISITANTE</div>
                </div>

                <div className="ef-match-scoreboard__content">
                    <div className="ef-match-scoreboard__team">
                        <EfClubBadge name={result.home} size="xl" />
                        <span className="ef-match-scoreboard__team-name">{result.home}</span>
                    </div>

                    <div className="ef-match-scoreboard__center">
                        <div className="ef-clock">
                            <span className={`ef-clock__time${isPlaying ? ' ef-clock__time--playing' : ''}`}>
                                {String(currentMinute).padStart(2, '0')}'
                            </span>
                            {isPlaying && <div className="ef-clock__dot" />}
                        </div>
                        <div className="ef-score-box ef-score-box--hero">
                            <div className="ef-score-box__num">{runningScore.home}</div>
                            <div className="ef-score-box__sep">-</div>
                            <div className="ef-score-box__num">{runningScore.away}</div>
                        </div>
                    </div>

                    <div className="ef-match-scoreboard__team">
                        <EfClubBadge name={result.away} size="xl" />
                        <span className="ef-match-scoreboard__team-name">{result.away}</span>
                    </div>
                </div>

                <div className="ef-match-progress">
                    <div className="ef-match-progress__bar" data-pct={progressPct} />
                    <div className="ef-match-progress__markers">
                        <span>0'</span>
                        <span>45'</span>
                        <span>90'</span>
                    </div>
                </div>
            </EfPanel>
        );
    };

    // === LIVE MATCH RENDERER === (Stitch v1.1: feed + sidebar split)
    const MAX_SUBS = 3;
    const handleLiveIntervention = (isSub = false) => {
        if (phase === 'prematch') {
            // Just force an update to reflect the change visually
            setPreStep(p => p);
            return;
        }
        if (isSub) {
            setLiveSubsCount(c => c + 1);
        }
        
        // SPLIT-SIM: Re-simulate remaining minutes after sub or tactic change
        const ids = matchIdsRef.current;
        if (ids) {
            const curMin = currentMinute;
            const endMin = phase === 'firsthalf' ? 45 : 90;
            
            // Extract the current baseline and truncate it to remove future events
            const isHome = ids.homeId === team.id;
            const eventsUpToNow = narration.filter(e => e && (e.minute || 0) <= curMin);
            let baseForResim = truncateSimResult(result?._baseSimResult, curMin);
            
            // Fallback if no base result exists
            if (!baseForResim) {
                baseForResim = {
                    homeGoals: isHome ? (result?.homeGoals || 0) : (result?.awayGoals || 0),
                    awayGoals: isHome ? (result?.awayGoals || 0) : (result?.homeGoals || 0),
                    events: { home: [], away: [], textLog: eventsUpToNow, scorers: [], cards: [], motm: null, _rawEvents: [] }
                };
            }
            
            // Re-simulate from current minute to end of half
            const resim = engine.playMatchFromMinute(
                ids.homeId, ids.awayId,
                curMin + 1, endMin, baseForResim, ids.isCup
            );
        
            // Splice: keep events up to now + new events from resim
            const newLaterEvents = (resim.events?.textLog || []).filter(e => e && (e.minute || 0) > curMin);
            const combinedNarration = [...eventsUpToNow, ...newLaterEvents];
            setNarration(combinedNarration);
            
            // Update score display
            setResult(prev => ({
                ...prev,
                homeGoals: isHome ? resim.homeGoals : resim.awayGoals,
                awayGoals: isHome ? resim.awayGoals : resim.homeGoals,
                _baseSimResult: resim,
            }));
            
            // If in second half, update the resolved match result
            if (phase === 'secondhalf') {
                engine.resolveHumanMatch(resim);
            }
            // If in first half, update firstHalfResult for correct 2nd half base
            if (phase === 'firsthalf') {
                setFirstHalfResult(resim);
            }
            
            // Restart ticker from current minute with new events
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
            setTimeout(() => startLiveTicker(combinedNarration, curMin + 1, endMin, null), 100);
        }
        
        forceUpdate();
    };

    const handleMidMatchChoice = (opt) => {
        if (opt.effect?.tacticShift) {
             engine.setTactic(opt.effect.tacticShift);
             setTacticChanged(true);
        }

        const deltaM = opt.effect?.moralDelta || 0;
        const deltaE = opt.effect?.energyDelta || 0;
        if (deltaM !== 0 || deltaE !== 0) {
            team.squad.forEach(p => {
                if (p.isTitular) {
                    p.moral = Math.max(0, Math.min(100, (p.moral || 50) + deltaM));
                    p.energy = Math.max(0, Math.min(100, p.energy + deltaE));
                }
            });
        }

        if (gameState.mode === 'unified' && engine.starPlayerId) {
            const player = team.squad.find(p => p.id === engine.starPlayerId);
            if (player && (deltaM !== 0 || deltaE !== 0)) {
                const impact = {
                    name: player.name,
                    changes: {
                        moral: deltaM !== 0 ? { before: player.moral - deltaM, after: player.moral } : undefined,
                        energy: deltaE !== 0 ? { before: player.energy - deltaE, after: player.energy } : undefined
                    }
                };
                const entryId = Date.now();
                setStarImpacts(prev => [...prev, { id: entryId, impact }]);
                setTimeout(() => setStarImpacts(prev => prev.filter(p => p.id !== entryId)), 3500);
            }
        }

        if (opt.effect?.tacticShift) {
             handleLiveIntervention(false);
        }

        setActiveMidMatchCard(null);
        setPaused(false);
        pausedRef.current = false;
        forceUpdate();
    };

    const renderLiveMatch = (half) => (
        <div className="ef-view-shell">
            <div className="ef-view-container">
                <Scoreboard half={half} />

                <div className="ef-match-live__layout">
                    <section className="ef-match-feed" style={{ display: 'flex', flexDirection: 'column' }}>
                        {displayedEvents.length > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                                <MatchHighlightVideo 
                                    event={displayedEvents[displayedEvents.length - 1]} 
                                    isHomeAttacking={true} /* We can enhance this later */
                                />
                            </div>
                        )}
                        <header className="ef-match-feed__header">
                            <span className="ef-match-feed__title">MATCH FEED</span>
                            <span className="ef-match-feed__icon" aria-hidden="true">~</span>
                        </header>
                        <div className="ef-match-feed__body" ref={logRef} style={{ flex: 1 }}>
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
                                        <div className="ef-match-log-row__text">{n.text}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <aside className="ef-match-sidebar">
                        <div className="ef-match-sidebar__panel">
                            <h3 className="ef-match-sidebar__title">SUBSTITUIÇÕES</h3>
                            <div className="ef-match-sidebar__subs">
                                <div className="ef-match-sidebar__sub-segments">
                                    {Array.from({ length: MAX_SUBS }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`ef-match-sidebar__sub-segment${i < liveSubsCount ? ' ef-match-sidebar__sub-segment--used' : ''}`}
                                        />
                                    ))}
                                </div>
                                <span className="ef-match-sidebar__sub-count">{liveSubsCount}/{MAX_SUBS}</span>
                            </div>
                        </div>

                        <div className="ef-match-sidebar__panel ef-match-sidebar__panel--grow">
                            <h3 className="ef-match-sidebar__title">VELOCIDADE</h3>
                            <div className="ef-match-live__speed-controls">
                                <EfButton size="md" variant={!paused && speed === 400 ? 'primary' : 'secondary'} onClick={() => { setSpeed(400); setPaused(false); pausedRef.current = false; }}>1x</EfButton>
                                <EfButton size="md" variant={!paused && speed === 200 ? 'primary' : 'secondary'} onClick={() => { setSpeed(200); setPaused(false); pausedRef.current = false; }}>2x</EfButton>
                                <EfButton size="md" variant={!paused && speed === 80 ? 'primary' : 'secondary'} onClick={() => { setSpeed(80); setPaused(false); pausedRef.current = false; }}>5x</EfButton>
                            </div>
                            <EfButton size="md" variant="secondary" className="ef-match-sidebar__skip" onClick={() => skipToEnd(narration, half === '1º TEMPO' ? 45 : 90, null)}>
                                PULAR <FastForward weight="fill" />
                            </EfButton>
                        </div>

                        <EfButton
                            variant={paused ? 'primary' : 'secondary'}
                            className="ef-match-sidebar__pause-cta"
                            onClick={() => { const next = !paused; setPaused(next); pausedRef.current = next; if (next) setLiveModalOpen(true); }}
                        >
                            {paused ? <Play weight="fill" /> : <Pause weight="fill" />} {paused ? 'RETOMAR' : 'PAUSAR & SUBSTITUIR'}
                        </EfButton>
                    </aside>
                </div>

                {half === '1º TEMPO' ? (
                    <EfButton variant="primary" className="ef-match-live__phase-btn" disabled={isPlaying} onClick={() => setPhase('halftime')}>
                        <Pause weight="fill" /> INTERVALO
                    </EfButton>
                ) : (
                    <EfButton variant="primary" className="ef-match-live__phase-btn" disabled={isPlaying} onClick={() => {
                        // Final resolve + advanceWeek only at fulltime
                        if (matchIdsRef.current && result?._baseSimResult) {
                            engine.resolveHumanMatch(result._baseSimResult);
                            engine.advanceWeek();
                        }
                        setPhase('fulltime');
                    }}>
                        <CheckCircle weight="fill" /> FIM DE JOGO
                    </EfButton>
                )}

                {liveModalOpen && (
                    <LiveSquadEditModal
                        team={team}
                        engine={engine}
                        currentMinute={phase === 'prematch' ? 0 : currentMinute}
                        liveSubsCount={phase === 'prematch' ? 0 : liveSubsCount}
                        maxSubs={phase === 'prematch' ? 999 : 3}
                        benchPlayerIds={phase === 'prematch' ? null : benchPlayers}
                        onSubMade={() => handleLiveIntervention(true)}
                        onTacticChanged={() => handleLiveIntervention(false)}
                        onClose={() => { setLiveModalOpen(false); setPaused(false); pausedRef.current = false; }}
                    />
                )}

                {activeMidMatchCard && (
                    <MidMatchCardModal
                        card={activeMidMatchCard}
                        onChoose={handleMidMatchChoice}
                        onClose={() => {
                            setActiveMidMatchCard(null);
                            setPaused(false);
                            pausedRef.current = false;
                        }}
                    />
                )}

                <div style={{ position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {starImpacts.map(entry => (
                        <StarImpactToast
                            key={entry.id}
                            impact={entry.impact}
                        />
                    ))}
                </div>
            </div>
        </div>
    );

    if (phase === 'firsthalf') return renderLiveMatch('1º TEMPO');
    if (phase === 'secondhalf') return renderLiveMatch('2º TEMPO');

    // === HALF TIME ===
    if (phase === 'halftime') {
        const titulares = team.squad.filter(p => p.isTitular && !p.injury);
        const subs = benchPlayers.length > 0
            ? benchPlayers.map(id => team.squad.find(p => p.id === id)).filter(p => p && !p.isTitular && !p.injury && !p.suspension)
            : team.squad.filter(p => !p.isTitular && !p.injury && !p.suspension).slice(0, 5);
        const tiredPlayers = team.squad.filter(p => p.isTitular && p.energy < 50);

        return (
            <div className="ef-view-shell">
                <div className="ef-view-container">
                    <EfPanel padding="lg" className="ef-match-halftime__header">
                        <div className="ef-match-halftime__title-box">
                            <Pause size={32} weight="fill" className="ef-match-halftime__title-icon" />
                            <h2 className="ef-sans ef-text-main ef-match-halftime__title">INTERVALO</h2>
                        </div>
                        <div className="ef-match-halftime__scoreboard">
                            <div className="ef-match-halftime__team">
                                <EfClubBadge name={result.home} size="lg" />
                                <span className="ef-sans ef-text-main ef-match-halftime__team-name">{result.home}</span>
                            </div>
                            <div className="ef-score-box ef-score-box--sm ef-match-halftime__score-box">
                                <div className="ef-score-box__num ef-score-box__num--md">{halfTimeData?.homeGoals ?? 0}</div>
                                <div className="ef-score-box__sep ef-score-box__sep--sm">-</div>
                                <div className="ef-score-box__num ef-score-box__num--md">{halfTimeData?.awayGoals ?? 0}</div>
                            </div>
                            <div className="ef-match-halftime__team">
                                <EfClubBadge name={result.away} size="lg" />
                                <span className="ef-sans ef-text-main ef-match-halftime__team-name">{result.away}</span>
                            </div>
                        </div>
                    </EfPanel>

                    <div className="ef-match-halftime__grid">
                        {!tacticChanged && (
                            <EfPanel padding="md" className="ef-match-halftime__tactics-panel">
                                <div className="ef-section-header">
                                    <Strategy size={24} className="ef-match-halftime__section-icon" />
                                    <h3>AJUSTE TÁTICO</h3>
                                </div>
                                <div className="ef-match-halftime__tactics-buttons">
                                    {Object.entries(TACTICS).map(([k, v]) => (
                                        <EfButton key={k} variant={engine.currentTactic === k ? 'primary' : 'secondary'}
                                            onClick={() => { engine.setTactic(k); setTacticChanged(true); forceUpdate(); }}>
                                            {v.name}
                                        </EfButton>
                                    ))}
                                </div>
                            </EfPanel>
                        )}

                        {liveSubsCount < 3 && subs.length > 0 && (
                            <EfPanel padding="md" className="ef-match-halftime__subs-panel">
                                <div className="ef-section-header">
                                    <ArrowsLeftRight size={24} className="ef-match-halftime__warning-icon" />
                                    <h3>SUBSTITUIÇÃO ({liveSubsCount}/3)</h3>
                                </div>

                                {!subUsed ? (
                                    <>
                                        <div className="ef-match-prematch__low-energy" style={{ marginBottom: '8px' }}>
                                            SELECIONE QUEM SAI:
                                        </div>
                                        <div className="ef-match-halftime__subs-list">
                                            {titulares.map(p => (
                                                <div key={p.id} className="ef-match-halftime__player-row" style={{ cursor: 'pointer' }}
                                                    onClick={() => setSubUsed(p)}>
                                                    <div className="ef-match-halftime__player-info">
                                                        <div className="ef-sans ef-text-main ef-match-halftime__player-name">
                                                            <strong>{p.position}</strong> {p.name} {p._isCaptain && '©️'} {getFormEmoji(p.form?.trend)}
                                                        </div>
                                                        <div className="ef-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                            OVR: <strong style={{ color: 'var(--text-main)' }}>{p.ovr}</strong> • 
                                                            <span style={{ color: getEnergyColor(p.energy) }}> COND: {p.energy}%</span> • 
                                                            Moral: {p.moral || 50}% • 
                                                            {p.age} anos
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : typeof subUsed === 'object' ? (
                                    <>
                                        <div style={{ padding: '8px 12px', background: 'var(--bg-surface-alt)', borderRadius: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="ef-sans"><strong>SAINDO:</strong> {subUsed.name} ({subUsed.position}) — OVR {subUsed.ovr}</span>
                                            <EfButton variant="secondary" size="sm" onClick={() => setSubUsed(false)}>CANCELAR</EfButton>
                                        </div>
                                        <div className="ef-match-prematch__low-energy" style={{ marginBottom: '8px' }}>
                                            SELECIONE QUEM ENTRA:
                                        </div>
                                        <div className="ef-match-halftime__subs-list">
                                            {subs.map(p => (
                                                <div key={p.id} className="ef-match-halftime__player-row">
                                                    <div className="ef-match-halftime__player-info">
                                                        <div className="ef-sans ef-text-main ef-match-halftime__player-name">
                                                            <strong>{p.position}</strong> {p.name} {getFormEmoji(p.form?.trend)}
                                                        </div>
                                                        <div className="ef-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                            OVR: <strong style={{ color: 'var(--text-main)' }}>{p.ovr}</strong> • 
                                                            <span style={{ color: getEnergyColor(p.energy) }}> COND: {p.energy}%</span> • 
                                                            Moral: {p.moral || 50}% • 
                                                            {p.age} anos
                                                        </div>
                                                    </div>
                                                    <EfButton variant="primary" size="sm" onClick={() => {
                                                        subUsed.isTitular = false;
                                                        p.isTitular = true;
                                                        p.energy = Math.min(100, p.energy + 15);
                                                        setLiveSubsCount(c => c + 1);
                                                        setSubUsed(true); // true = done, shows completed state
                                                        forceUpdate();
                                                    }}>
                                                        <ArrowsLeftRight size={16} /> ENTRAR
                                                    </EfButton>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="ef-match-halftime__subs-list">
                                        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            <CheckCircle size={20} style={{ verticalAlign: 'middle' }} /> Substituição realizada.
                                            {liveSubsCount < 3 && (
                                                <EfButton variant="secondary" size="sm" style={{ marginLeft: '12px' }} onClick={() => setSubUsed(false)}>
                                                    MAIS UMA SUBSTITUIÇÃO
                                                </EfButton>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </EfPanel>
                        )}
                    </div>

                    <EfButton variant="primary" className="ef-match-halftime__resume-btn" onClick={() => {
                        // SPLIT-SIM PHASE 2: Re-simulate second half with CURRENT squad/tactics
                        const ids = matchIdsRef.current;
                        if (ids && firstHalfResult) {
                            const secondHalf = engine.playMatchSecondHalf(ids.homeId, ids.awayId, firstHalfResult, ids.isCup);
                            const isHome = ids.homeId === team.id;

                            // Combine first + second half narration
                            const firstHalfEvents = narration; // already stored from first half
                            const secondHalfEvents = (secondHalf.events?.textLog || []).filter(e => e && e.minute > 45);
                            const allEvents = [...firstHalfEvents, ...secondHalfEvents];
                            setNarration(allEvents);

                            // Update final score
                            setResult(prev => ({
                                ...prev,
                                homeGoals: isHome ? secondHalf.homeGoals : secondHalf.awayGoals,
                                awayGoals: isHome ? secondHalf.awayGoals : secondHalf.homeGoals,
                                _baseSimResult: secondHalf,
                            }));

                            // Update match stats
                            const totalChances = allEvents.filter(e => e?.text?.includes('⚽') || e?.text?.includes('Defesa') || e?.text?.includes('salva')).length;
                            const goals = allEvents.filter(e => e?.text?.includes('⚽')).length;
                            setMatchStats({ totalChances, goals, injuries: (engine.weekInjuries?.length ?? 0) });

                            // DON'T advanceWeek here — wait for fulltime to allow live subs
                            // advanceWeek will be called at fulltime transition

                            setPhase('secondhalf');
                            setTimeout(() => startLiveTicker(allEvents, 46, 90, null), 300);
                        } else {
                            // Fallback: no split-sim data, just replay
                            setPhase('secondhalf');
                            setTimeout(() => startLiveTicker(narration, 46, 90, null), 300);
                        }
                    }}>
                        <Play size={24} weight="fill" /> INICIAR 2º TEMPO
                    </EfButton>
                </div>
            </div>
        );
    }

    // === FULL TIME ===
    const lastMatchScorers = narration.filter(n => n && n.text?.includes('⚽'));
    const lastMatchCards = narration.filter(n => n && (n.text?.includes('🟨') || n.text?.includes('🟥')));
    const motmEntry = narration.find(n => n.text?.includes('⭐ Craque'));

    return (
        <div className="ef-view-shell">
            <div className="ef-view-container">
                {banner && <EfBanner type={banner} onDismiss={() => setBanner(null)} />}

                <EfPanel padding="lg" className="ef-match-fulltime__header">
                    <div className="ef-match-fulltime__title-box">
                        <CheckCircle size={32} weight="fill" className="ef-match-fulltime__title-icon" />
                        <h2 className="ef-sans ef-text-main ef-match-fulltime__title">FIM DE JOGO</h2>
                    </div>
                    <div className="ef-match-fulltime__scoreboard">
                        <div className="ef-match-fulltime__team">
                            <EfClubBadge name={result?.home} size="xl" />
                            <span className="ef-sans ef-text-main ef-match-fulltime__team-name">{result?.home}</span>
                        </div>
                        <div className="ef-score-box ef-match-fulltime__score-box">
                            <div className="ef-score-box__num">{result?.homeGoals}</div>
                            <div className="ef-score-box__sep">-</div>
                            <div className="ef-score-box__num">{result?.awayGoals}</div>
                        </div>
                        <div className="ef-match-fulltime__team">
                            <EfClubBadge name={result?.away} size="xl" />
                            <span className="ef-sans ef-text-main ef-match-fulltime__team-name">{result?.away}</span>
                        </div>
                    </div>
                    {motmEntry && (
                        <div className="ef-sans ef-match-fulltime__motm ef-text-accent">
                            <ChartBar size={20} weight="fill" /> {motmEntry.text}
                        </div>
                    )}
                </EfPanel>

                <div className="ef-match-fulltime__grid">
                    <EfPanel padding="md" className="ef-match-fulltime__goals-panel">
                        <div className="ef-section-header">
                            <SoccerBall size={24} className="ef-match-fulltime__goals-icon" />
                            <h3>GOLS & EVENTOS</h3>
                        </div>
                        {lastMatchScorers.length > 0 ? (
                            <div className="ef-match-fulltime__goals-list">
                                {lastMatchScorers.map((s, i) => (
                                    <div key={i} className="ef-match-fulltime__goal-row">
                                        <div className="ef-mono ef-text-primary ef-match-fulltime__goal-minute">{s.minute}'</div>
                                        <div className="ef-sans ef-text-main ef-match-fulltime__goal-text">{s.text}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="ef-sans ef-text-muted ef-match-fulltime__no-goals">
                                Nenhum gol na partida.
                            </div>
                        )}
                    </EfPanel>

                    <EfPanel padding="md" className="ef-match-fulltime__stats-panel">
                        <div className="ef-section-header">
                            <ChartBar size={24} className="ef-match-fulltime__stats-icon" />
                            <h3>ESTATÍSTICAS DA PARTIDA</h3>
                        </div>
                        <div className="ef-match-fulltime__stats-list">
                            <div className="ef-stat-line">
                                <span className="ef-stat-line__label">Finalizações</span>
                                <strong className="ef-stat-line__value">{matchStats?.totalChances || 0}</strong>
                            </div>
                            <div className="ef-stat-line">
                                <span className="ef-stat-line__label">Tática Utilizada</span>
                                <strong className="ef-sans ef-text-main">{TACTICS[engine.currentTactic]?.name}</strong>
                            </div>
                            <div className="ef-stat-line">
                                <span className="ef-stat-line__label"><Cardholder weight="fill" /> Cartões</span>
                                <strong className="ef-stat-line__value">{lastMatchCards.length}</strong>
                            </div>
                            <div className="ef-stat-line">
                                <span className="ef-stat-line__label"><FirstAid weight="fill" /> Lesões</span>
                                <strong className="ef-stat-line__value">{matchStats?.injuries || 0}</strong>
                            </div>
                        </div>
                    </EfPanel>

                    {engine.board && (
                        <EfPanel padding="md" className="ef-match-fulltime__board-panel">
                            <div className="ef-section-header">
                                <Shield size={24} />
                                <h3>STATUS DA DIRETORIA</h3>
                            </div>
                            <div className="ef-match-fulltime__board-status" style={{ borderColor: engine.board.getStatus().color }}>
                                <div className="ef-match-fulltime__board-info">
                                    <div className="ef-sans ef-text-muted ef-match-fulltime__board-label">Confiança</div>
                                    <div className="ef-sans ef-match-fulltime__board-value" style={{ color: engine.board.getStatus().color }}>{engine.board.getStatus().label}</div>
                                </div>
                                <div className="ef-mono ef-match-fulltime__board-percent" style={{ color: engine.board.getStatus().color }}>
                                    {engine.board.confidence}%
                                </div>
                            </div>
                        </EfPanel>
                    )}
                </div>

                <div className="ef-match-fulltime__actions">
                    <EfButton variant="primary" className="ef-match-fulltime__action-btn" onClick={() => { setPhase('prematch'); setResult(null); setNarration([]); setDisplayedEvents([]); setCurrentMinute(0); setSubUsed(false); setTacticChanged(false); setPreStep(1); setTalkDone(false); changeView(getDashboardView()); }}>
                        <ChartBar size={20} /> VOLTAR AO DASHBOARD
                    </EfButton>
                    <EfButton variant="secondary" className="ef-match-fulltime__action-btn" onClick={() => { setPhase('prematch'); setResult(null); setNarration([]); setDisplayedEvents([]); setCurrentMinute(0); setSubUsed(false); setTacticChanged(false); setPreStep(1); setTalkDone(false); changeView('press'); }}>
                        <MicrophoneStage size={20} /> COLETIVA PÓS-JOGO
                    </EfButton>
                </div>
            </div>
        </div>
    );
}

export default MatchView;
