import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { TACTICS, FORMATIONS, TEAM_TALKS } from '../engine/ManagerSystems';
import { getFormEmoji } from '../engine/PlayerDevelopment';
import { sfx } from '../utils/sound';

export function MatchView() {
    const { gameState, changeView, getEngine, forceUpdate } = useGame();
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
    const logRef = useRef(null);
    const timerRef = useRef(null);
    const speedRef = useRef(200);

    const cond = engine.matchCondition;
    const tactic = TACTICS[engine.currentTactic];

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

    // Sync speedRef when speed state changes (BUG-003 fix)
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
            min++;
            tickerStateRef.current.currentMin = min;
            setCurrentMinute(min);

            while (eventIdx < eventQueue.length && eventQueue[eventIdx].minute <= min) {
                // BUG-016 fix: dedupe via key (minute, text) — evita repetição em re-renders
                const ev = eventQueue[eventIdx];
                setDisplayedEvents(prev => {
                    const key = `${ev.minute}-${ev.text}`;
                    if (prev.some(e => e && `${e.minute}-${e.text}` === key)) return prev;
                    return [...prev, ev];
                });
                // P1-6: sound FX para eventos importantes
                if (ev.text?.includes('⚽')) sfx.goal();
                else if (ev.text?.includes('🟨') || ev.text?.includes('🟥')) sfx.card();
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
        // Use start minute from tickerState to avoid duplicating events from previous halves
        const startMin = tickerStateRef.current?.eventQueue?.[0]?.minute || 0;
        const remaining = events.filter(e => e && e.minute >= startMin && e.minute <= endMin);
        setDisplayedEvents(prev => {
            // Merge: keep already-displayed events and add remaining that aren't already shown
            const existingMinutes = new Set(prev.map(e => `${e.minute}-${e.text}`));
            const newEvents = remaining.filter(e => !existingMinutes.has(`${e.minute}-${e.text}`));
            return [...prev, ...newEvents];
        });
        setCurrentMinute(endMin);
        setIsPlaying(false);
        tickerStateRef.current = null;
        if (onComplete) onComplete();
    };

    // BUG-017 fix: contar gols ⚽ direto, sem depender de regex (mais robusto).
    // displayedEvents reflete log live, score = goals shown so far.
    const getRunningScore = () => {
        if (!result) return { home: 0, away: 0 };
        let h = 0, a = 0;
        (displayedEvents || []).forEach(e => {
            if (!e || !e.text) return;
            if (e.text.includes('⚽')) {
                // Tenta regex first
                const match = e.text.match(/\((\d+)\s*x\s*(\d+)\)/);
                if (match) { h = parseInt(match[1]); a = parseInt(match[2]); }
            }
        });
        return { home: h, away: a };
    };

    // BUG-017 final score fallback: se 2º tempo done mas displayed score 0-0, usa result final.
    const getDisplayScore = (half) => {
        const live = getRunningScore();
        // Se passou do 90' e live ainda 0-0 mas result tem goals, usa final
        if (currentMinute >= 90 && live.home === 0 && live.away === 0 && result && (result.homeGoals > 0 || result.awayGoals > 0)) {
            return { home: result.homeGoals, away: result.awayGoals };
        }
        return live;
    };

    // === PRE-MATCH (3-step wizard) ===
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

                // BUG-015 fix: null-safe filter (events array pode ter entries undefined)
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

        const stepLabels = ['Escalação', 'Tática', 'Confirmar'];

        return (
            <div className="main-content fade-in">
                {/* Step indicator */}
                <div className="card card-compact" style={{textAlign:'center'}}>
                    <h2 style={{fontSize:'1.2rem',margin:0}}>⚽ Pré-Jogo — Semana {engine.currentWeek + 1}</h2>
                    <div style={{display:'flex',justifyContent:'center',gap:'0.5rem',marginTop:'0.4rem'}}>
                        {stepLabels.map((label, i) => (
                            <div key={i} style={{display:'flex',alignItems:'center',gap:'0.2rem',fontSize:'0.7rem',
                                color: preStep === i + 1 ? 'var(--primary)' : 'var(--text-muted)',
                                fontWeight: preStep === i + 1 ? 700 : 400}}>
                                <span style={{
                                    width:'18px',height:'18px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                                    fontSize:'0.6rem',background: preStep > i + 1 ? 'var(--primary)' : preStep === i + 1 ? 'rgba(16,185,129,0.2)' : 'var(--bg-panel-hover)',
                                    color: preStep > i + 1 ? 'var(--bg-base)' : preStep === i + 1 ? 'var(--primary)' : 'var(--text-muted)'
                                }}>{preStep > i + 1 ? '✓' : i + 1}</span>
                                {label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* STEP 1: Squad Review */}
                {preStep === 1 && (
                    <>
                        <div className="card card-compact">
                            <div className="inline-stats" style={{justifyContent:'center'}}>
                                <div className="inline-stat"><span className="stat-value">{sectors.goalkeeper}</span><span className="stat-label">GOL</span></div>
                                <div className="inline-stat"><span className="stat-value">{sectors.defense}</span><span className="stat-label">DEF</span></div>
                                <div className="inline-stat"><span className="stat-value">{sectors.midfield}</span><span className="stat-label">MEI</span></div>
                                <div className="inline-stat"><span className="stat-value">{sectors.attack}</span><span className="stat-label">ATA</span></div>
                            </div>
                        </div>
                        <div className="card card-compact">
                            <h4 style={{fontSize:'0.8rem',marginBottom:'0.4rem',color:'var(--text-muted)'}}>TITULARES ({titulares.length})</h4>
                            <div style={{display:'flex',flexDirection:'column',gap:'0.15rem'}}>
                                {titulares.map(p => (
                                    <div key={p.id} style={{
                                        display:'flex', justifyContent:'space-between', alignItems:'center',
                                        padding:'0.2rem 0.4rem', borderRadius:'var(--radius-xs)',
                                        background: p.energy < 40 ? 'rgba(239,68,68,0.1)' : 'transparent', fontSize:'0.78rem'
                                    }}>
                                        <span>
                                            <strong style={{color:'var(--text-muted)',marginRight:'0.3rem',fontSize:'0.7rem'}}>{p.position}</strong>
                                            {p.name}
                                            {p._isCaptain && <span style={{marginLeft:'3px'}}>©️</span>}
                                            {getFormEmoji(p.form?.trend) && <span style={{marginLeft:'3px'}}>{getFormEmoji(p.form?.trend)}</span>}
                                        </span>
                                        <span style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
                                            <span style={{fontWeight:600}}>{p.ovr}</span>
                                            <span style={{color: p.energy < 40 ? 'var(--danger)' : p.energy < 70 ? 'var(--accent)' : 'var(--primary)', fontSize:'0.72rem'}}>⚡{p.energy}%</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {lowEnergy.length > 0 && <div className="alert-badge danger" style={{marginTop:'0.3rem'}}>⚠️ {lowEnergy.length} com energia baixa</div>}
                        </div>
                        <button className="btn btn-primary" style={{width:'100%'}} onClick={() => setPreStep(2)}>Próximo: Tática →</button>
                    </>
                )}

                {/* STEP 2: Tactics + Team Talk */}
                {preStep === 2 && (
                    <>
                        <div className="card card-compact">
                            <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.3rem'}}>FORMAÇÃO</h4>
                            <div className="action-bar">
                                {Object.keys(FORMATIONS).map(f => (
                                    <button key={f} className={`btn btn-sm ${team.formation === f ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => { engine.setFormation(f); forceUpdate(); }}>{f}</button>
                                ))}
                            </div>
                            <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',margin:'0.5rem 0 0.3rem'}}>TÁTICA</h4>
                            <div className="action-bar">
                                {Object.entries(TACTICS).map(([k, v]) => (
                                    <button key={k} className={`btn btn-sm ${engine.currentTactic === k ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => { engine.setTactic(k); forceUpdate(); }}>{v.name}</button>
                                ))}
                            </div>
                            <p style={{fontSize:'0.72rem',color:'var(--text-muted)',marginTop:'0.2rem'}}>{TACTICS[engine.currentTactic]?.description}</p>
                        </div>
                        <div className="card card-compact">
                            <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.3rem'}}>📢 PRELEÇÃO</h4>
                            {talkDone ? (
                                <div className="alert-badge success">✅ Preleção feita!</div>
                            ) : (
                                <div style={{display:'flex',flexWrap:'wrap',gap:'0.3rem'}}>
                                    {TEAM_TALKS.map(t => (
                                        <button key={t.id} className="btn btn-secondary btn-sm"
                                            onClick={() => { engine.doTeamTalk(t.id); setTalkDone(true); forceUpdate(); }}>{t.name}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div style={{display:'flex',gap:'0.5rem'}}>
                            <button className="btn btn-secondary" style={{flex:1}} onClick={() => setPreStep(1)}>← Voltar</button>
                            <button className="btn btn-primary" style={{flex:2}} onClick={() => setPreStep(3)}>Confirmar →</button>
                        </div>
                    </>
                )}

                {/* STEP 3: Confirmation */}
                {preStep === 3 && (
                    <>
                        <div className="card card-compact" style={{textAlign:'center'}}>
                            <div style={{fontSize:'0.85rem',color:'var(--text-muted)',marginBottom:'0.3rem'}}>
                                {team.name} • {team.formation} • {tactic?.name}
                            </div>
                            {cond && <div className="alert-badge info" style={{display:'inline-flex',marginBottom:'0.3rem'}}>{cond.name}</div>}
                            <div className="inline-stats" style={{justifyContent:'center'}}>
                                <div className="inline-stat"><span className="stat-value">{sectors.goalkeeper}</span><span className="stat-label">GOL</span></div>
                                <div className="inline-stat"><span className="stat-value">{sectors.defense}</span><span className="stat-label">DEF</span></div>
                                <div className="inline-stat"><span className="stat-value">{sectors.midfield}</span><span className="stat-label">MEI</span></div>
                                <div className="inline-stat"><span className="stat-value">{sectors.attack}</span><span className="stat-label">ATA</span></div>
                            </div>
                            <div style={{fontSize:'0.72rem',color: talkDone ? 'var(--primary)' : 'var(--accent)',marginTop:'0.3rem'}}>
                                {talkDone ? '✅ Preleção feita' : '⚠️ Sem preleção'}
                            </div>
                        </div>
                        <button className="btn-cta" onClick={launchMatch}>⚽ INICIAR PARTIDA</button>
                        <button className="btn btn-secondary" style={{width:'100%',marginTop:'0.3rem'}} onClick={() => setPreStep(2)}>← Voltar</button>
                    </>
                )}

                <button className="btn btn-secondary" style={{width:'100%',marginTop:'0.5rem',opacity:0.5,fontSize:'0.75rem'}} onClick={() => changeView('dashboard')}>
                    Cancelar
                </button>
            </div>
        );
    }

    const runningScore = getRunningScore();

    // === SCOREBOARD (shared between phases) ===
    const Scoreboard = ({ half }) => (
        <div className="card" style={{ textAlign: 'center', padding: '0.75rem' }}>
            <div className="match-teams">
                <span className="team-name">{result.home}</span>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                    <div className="match-score">{runningScore.home} — {runningScore.away}</div>
                    {/* Cronômetro */}
                    <div style={{
                        display:'flex',alignItems:'center',gap:'0.5rem',marginTop:'0.3rem'
                    }}>
                        <span style={{
                            fontFamily:'Outfit',fontWeight:700,fontSize:'1.4rem',
                            color: isPlaying ? 'var(--primary)' : 'var(--text-muted)',
                            minWidth:'3rem',textAlign:'center'
                        }}>
                            {currentMinute}'
                        </span>
                        {isPlaying && <span className="pulse live-indicator" style={{fontSize:'0.6rem',color:'var(--danger)'}}>● AO VIVO</span>}
                    </div>
                    <span style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>{half}</span>
                </div>
                <span className="team-name">{result.away}</span>
            </div>
        </div>
    );

    // === FIRST HALF ===
    if (phase === 'firsthalf') {
        return (
            <div className="main-content fade-in">
                <Scoreboard half="1º Tempo" />

                <div className="narration-log" ref={logRef}>
                    {displayedEvents.filter(e => e && e.minute <= 45).map((n, i) => (
                        <div key={i} className={`${n.text?.includes('⚽') ? 'goal-line' : ''} ${n.text?.includes('🟨') ? 'card-line' : ''}`}
                             style={{animation: 'slideUp 0.2s ease-out'}}>
                            <strong style={{color:'var(--text-muted)',fontSize:'0.7rem',marginRight:'0.4rem'}}>{n.minute}'</strong>
                            {n.text}
                        </div>
                    ))}
                </div>

                <div style={{display:'flex',gap:'0.5rem',marginTop:'0.5rem'}}>
                    {/* Speed controls */}
                    <div style={{display:'flex',gap:'0.25rem',flex:1}}>
                        <button className={`btn btn-sm ${speed === 400 ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setSpeed(400)}>1x</button>
                        <button className={`btn btn-sm ${speed === 200 ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setSpeed(200)}>2x</button>
                        <button className={`btn btn-sm ${speed === 80 ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setSpeed(80)}>5x</button>
                    </div>
                    <button className="btn btn-sm btn-secondary" onClick={() => {
                        skipToEnd(narration.filter(e => e && e.minute <= 45), 45, null);
                    }}>⏭️ Pular</button>
                </div>

                <button className="btn btn-primary" style={{width:'100%',marginTop:'0.5rem'}}
                    disabled={isPlaying}
                    onClick={() => setPhase('halftime')}>
                    ⏸️ Intervalo
                </button>
            </div>
        );
    }

    // === HALF TIME ===
    if (phase === 'halftime') {
        const subs = team.squad.filter(p => !p.isTitular && !p.injury).slice(0, 5);
        const tiredPlayers = team.squad.filter(p => p.isTitular && p.energy < 50);

        return (
            <div className="main-content fade-in">
                <div className="card" style={{ textAlign: 'center', padding:'0.75rem' }}>
                    <h3 style={{color:'var(--accent)',marginBottom:'0.3rem'}}>⏸️ INTERVALO</h3>
                    <div className="match-teams">
                        <span className="team-name">{result.home}</span>
                        <div className="match-score">{halfTimeData?.homeGoals ?? 0} — {halfTimeData?.awayGoals ?? 0}</div>
                        <span className="team-name">{result.away}</span>
                    </div>
                </div>

                {/* Tactic change */}
                {!tacticChanged && (
                    <div className="card card-compact">
                        <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.4rem'}}>⚔️ AJUSTE TÁTICO</h4>
                        <div className="action-bar">
                            {Object.entries(TACTICS).map(([k, v]) => (
                                <button key={k} className={`btn btn-sm ${engine.currentTactic === k ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => {
                                        engine.setTactic(k);
                                        setTacticChanged(true);
                                        forceUpdate();
                                    }}>
                                    {v.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Substitution */}
                {!subUsed && tiredPlayers.length > 0 && subs.length > 0 && (
                    <div className="card card-compact">
                        <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.4rem'}}>🔄 SUBSTITUIÇÃO</h4>
                        {tiredPlayers.slice(0, 3).map(p => (
                            <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.25rem 0',fontSize:'0.8rem'}}>
                                <span style={{color:'var(--danger)'}}>
                                    {p.name} ({p.position}) ⚡{p.energy}%
                                </span>
                                <button className="btn btn-primary btn-sm" onClick={() => {
                                    const sub = subs[0];
                                    if (sub) {
                                        p.isTitular = false;
                                        sub.isTitular = true;
                                        sub.energy = Math.min(100, sub.energy + 15);
                                        setSubUsed(true);
                                        forceUpdate();
                                    }
                                }}>
                                    ← {subs[0]?.name} (⚡{subs[0]?.energy}%)
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <button className="btn-cta" onClick={() => {
                    setPhase('secondhalf');
                    setTimeout(() => {
                        startLiveTicker(narration, 46, 90, null);
                    }, 300);
                }}>
                    ▶️ INICIAR 2º TEMPO
                </button>
            </div>
        );
    }

    // === SECOND HALF ===
    if (phase === 'secondhalf') {
        return (
            <div className="main-content fade-in">
                <Scoreboard half="2º Tempo" />

                <div className="narration-log" ref={logRef}>
                    {displayedEvents.filter(e => e && e.minute > 45).map((n, i) => (
                        <div key={i} className={`${n.text?.includes('⚽') ? 'goal-line' : ''} ${n.text?.includes('🟨') ? 'card-line' : ''}`}
                             style={{animation: 'slideUp 0.2s ease-out'}}>
                            <strong style={{color:'var(--text-muted)',fontSize:'0.7rem',marginRight:'0.4rem'}}>{n.minute}'</strong>
                            {n.text}
                        </div>
                    ))}
                </div>

                <div style={{display:'flex',gap:'0.5rem',marginTop:'0.5rem'}}>
                    <div style={{display:'flex',gap:'0.25rem',flex:1}}>
                        <button className={`btn btn-sm ${speed === 400 ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setSpeed(400)}>1x</button>
                        <button className={`btn btn-sm ${speed === 200 ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setSpeed(200)}>2x</button>
                        <button className={`btn btn-sm ${speed === 80 ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setSpeed(80)}>5x</button>
                    </div>
                    <button className="btn btn-sm btn-secondary" onClick={() => {
                        skipToEnd(narration, 90, null);
                    }}>⏭️ Pular</button>
                </div>

                <button className="btn btn-primary" style={{width:'100%',marginTop:'0.5rem'}}
                    disabled={isPlaying}
                    onClick={() => setPhase('fulltime')}>
                    🏁 Fim de Jogo
                </button>
            </div>
        );
    }

    // === FULL TIME ===
    const lastMatchScorers = narration.filter(n => n && n.text?.includes('⚽'));
    const lastMatchCards = narration.filter(n => n && n.text?.includes('🟨'));
    const motmEntry = narration.find(n => n.text?.includes('⭐ Craque'));

    return (
        <div className="main-content fade-in">
            <div className="card" style={{ textAlign: 'center' }}>
                <h2 style={{fontSize:'1.2rem',marginBottom:'0.5rem'}}>🏁 FIM DE JOGO</h2>
                <div className="match-teams">
                    <span className="team-name">{result?.home}</span>
                    <div className="match-score">{result?.homeGoals} — {result?.awayGoals}</div>
                    <span className="team-name">{result?.away}</span>
                </div>
                {motmEntry && <p style={{color:'var(--primary)',fontSize:'0.8rem',marginTop:'0.4rem'}}>{motmEntry.text}</p>}
            </div>

            {/* Scorers */}
            {lastMatchScorers.length > 0 && (
                <div className="card card-compact">
                    <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.3rem'}}>⚽ GOLS</h4>
                    {lastMatchScorers.map((s, i) => (
                        <div key={i} style={{fontSize:'0.78rem',color:'var(--text-main)',padding:'0.15rem 0',borderBottom:'1px solid var(--border-subtle)'}}>
                            <strong style={{color:'var(--primary)',marginRight:'0.3rem'}}>{s.minute}'</strong>{s.text}
                        </div>
                    ))}
                </div>
            )}

            {/* Stats + Report */}
            <div className="card card-compact">
                <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.3rem'}}>📊 ESTATÍSTICAS</h4>
                <ul className="stats-list">
                    {matchStats && <>
                        <li><span>Finalizações:</span> <strong>{matchStats.totalChances}</strong></li>
                        <li><span>Gols:</span> <strong>{matchStats.goals}</strong></li>
                    </>}
                    <li><span>Tática:</span> <strong>{TACTICS[engine.currentTactic]?.name}</strong></li>
                    {lastMatchCards.length > 0 && <li><span>🟨 Cartões:</span> <strong>{lastMatchCards.length}</strong></li>}
                    {(engine.weekInjuries?.length ?? 0) > 0 && <li><span>🏥 Lesões:</span> <strong style={{color:'var(--danger)'}}>{(engine.weekInjuries?.length ?? 0)}</strong></li>}
                </ul>
            </div>

            {/* Injuries */}
            {(engine.weekInjuries?.length ?? 0) > 0 && (
                <div className="card card-compact">
                    <h4 style={{fontSize:'0.8rem',color:'var(--danger)',marginBottom:'0.25rem'}}>🏥 LESÕES</h4>
                    {(engine.weekInjuries || []).map((inj, i) => (
                        <p key={i} style={{color:'var(--danger)',fontSize:'0.75rem',padding:'0.1rem 0'}}>{inj.emoji} {inj.player} — {inj.name} ({inj.weeksLeft} sem)</p>
                    ))}
                </div>
            )}

            {/* Board + Events */}
            <div className="card card-compact">
                {engine.board && (
                    <div style={{marginBottom:'0.5rem'}}>
                        <p style={{fontSize:'0.78rem',color: engine.board.getStatus().color}}>
                            {engine.board.getStatus().emoji} Diretoria: {engine.board.getStatus().label} ({engine.board.confidence}%)
                        </p>
                    </div>
                )}
                {(engine.weekEvents?.length ?? 0) > 0 && (
                    <div className="event-feed">
                        {(engine.weekEvents || []).map((ev, i) => {
                            const isGrowth = ev.includes('📈');
                            const isDecline = ev.includes('📉') || ev.includes('☠️') || ev.includes('👴');
                            const isGood = ev.includes('🎉') || ev.includes('📚') || ev.includes('🎂') || ev.includes('🇧🇷');
                            return (
                                <div key={i} className={`event-item ${isGrowth || isGood ? 'highlight' : ''} ${isDecline ? 'danger' : ''}`}>
                                    {ev}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <button className="btn-cta" onClick={() => { setPhase('prematch'); setResult(null); setNarration([]); setDisplayedEvents([]); setCurrentMinute(0); setSubUsed(false); setTacticChanged(false); setPreStep(1); setTalkDone(false); changeView('dashboard'); }}>
                📊 VOLTAR AO DASHBOARD
            </button>
        </div>
    );
}
