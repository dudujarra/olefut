import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { TACTICS } from '../engine/ManagerSystems';

export function MatchView() {
    const { gameState, changeView, getEngine, forceUpdate } = useGame();
    const engine = getEngine();
    const team = engine.getTeam(gameState.teamId);
    const [phase, setPhase] = useState('prematch'); // prematch | firsthalf | halftime | secondhalf | fulltime
    const [result, setResult] = useState(null);
    const [narration, setNarration] = useState([]);
    const [visibleNarr, setVisibleNarr] = useState([]);
    const [halfTimeData, setHalfTimeData] = useState(null);
    const [subUsed, setSubUsed] = useState(false);
    const [tacticChanged, setTacticChanged] = useState(false);
    const [matchStats, setMatchStats] = useState(null);

    const cond = engine.matchCondition;
    const tactic = TACTICS[engine.currentTactic];

    // Pré-match info
    if (phase === 'prematch') {
        const titulares = team.squad.filter(p => p.isTitular && !p.injury);
        const lowEnergy = titulares.filter(p => p.energy < 40);

        return (
            <div className="main-content fade-in">
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <h2>⚽ Pré-Jogo — Semana {engine.currentWeek + 1}</h2>
                    <div style={{fontSize:'0.9rem',color:'var(--text-muted)',margin:'0.5rem 0'}}>
                        {team.name} • {team.formation} • {tactic?.name}
                    </div>
                    {cond && <div style={{fontSize:'0.85rem',color:'var(--accent)',marginBottom:'0.5rem'}}>{cond.name}</div>}

                    <div className="card" style={{textAlign:'left',marginTop:'1rem'}}>
                        <h4>Titulares ({titulares.length})</h4>
                        <div style={{display:'flex',flexWrap:'wrap',gap:'0.3rem',marginTop:'0.5rem'}}>
                            {titulares.map(p => (
                                <span key={p.id} style={{
                                    padding:'0.2rem 0.5rem',
                                    borderRadius:'var(--radius-sm)',
                                    fontSize:'0.75rem',
                                    background: p.energy < 40 ? 'rgba(239,68,68,0.2)' : 'var(--bg-panel-hover)',
                                    color: p.energy < 40 ? 'var(--danger)' : 'var(--text-main)'
                                }}>
                                    {p.name} ({p.position} {p.ovr}) ⚡{p.energy}%
                                </span>
                            ))}
                        </div>
                        {lowEnergy.length > 0 && (
                            <p style={{color:'var(--danger)',fontSize:'0.75rem',marginTop:'0.5rem'}}>
                                ⚠️ {lowEnergy.length} jogador(es) com energia baixa. Risco de lesão aumentado.
                            </p>
                        )}
                    </div>

                    <button className="btn btn-primary" style={{marginTop:'1rem',width:'100%'}} onClick={() => {
                        // Simulate match
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

                            // Split events: first half (min <= 45) and second half
                            const firstHalf = allEvents.filter(e => e.minute <= 45);
                            const secondHalf = allEvents.filter(e => e.minute > 45);

                            setResult({
                                home: isHome ? team.name : opponent.name,
                                away: isHome ? opponent.name : team.name,
                                homeGoals: myMatch.score.homeGoals,
                                awayGoals: myMatch.score.awayGoals,
                            });
                            setNarration(allEvents);

                            // Half time data
                            const htHomeGoals = myMatch.score.events?.home?.filter(e => e.minute <= 45).length || 0;
                            const htAwayGoals = myMatch.score.events?.away?.filter(e => e.minute <= 45).length || 0;
                            setHalfTimeData({
                                homeGoals: isHome ? htHomeGoals : htAwayGoals,
                                awayGoals: isHome ? htAwayGoals : htHomeGoals,
                            });

                            // Match stats
                            const totalChances = allEvents.filter(e => e.text && (e.text.includes('GOOOL') || e.text.includes('Defesaça'))).length;
                            const goals = allEvents.filter(e => e.text && e.text.includes('GOOOL')).length;
                            setMatchStats({
                                totalChances,
                                goals,
                                injuries: engine.weekInjuries.length,
                            });

                            setVisibleNarr(firstHalf);
                            setPhase('firsthalf');
                        } else {
                            setResult({ home: team.name, away: 'Sem Jogo', homeGoals: '-', awayGoals: '-' });
                            setPhase('fulltime');
                        }
                        forceUpdate();
                    }}>
                        🟢 Iniciar Partida
                    </button>

                    <button className="btn btn-secondary" style={{marginTop:'0.5rem',width:'100%'}} onClick={() => changeView('dashboard')}>
                        ← Voltar ao Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // === FIRST HALF ===
    if (phase === 'firsthalf') {
        return (
            <div className="main-content fade-in">
                <div className="card" style={{ textAlign: 'center' }}>
                    <div className="match-teams">
                        <span className="team-name">{result.home}</span>
                        <div className="match-score">{halfTimeData?.homeGoals ?? 0} — {halfTimeData?.awayGoals ?? 0}</div>
                        <span className="team-name">{result.away}</span>
                    </div>
                    <p style={{color:'var(--accent)',fontSize:'0.8rem'}}>1º Tempo</p>
                </div>

                <div className="narration-log">
                    {visibleNarr.map((n, i) => (
                        <div key={i} className={n.text?.includes('GOOOL') ? 'goal-line' : ''}>{n.minute}' — {n.text}</div>
                    ))}
                </div>

                <button className="btn btn-primary" style={{width:'100%',marginTop:'0.5rem'}} onClick={() => setPhase('halftime')}>
                    ⏸️ Intervalo
                </button>
            </div>
        );
    }

    // === HALF TIME — DECISION POINT ===
    if (phase === 'halftime') {
        const subs = team.squad.filter(p => !p.isTitular && !p.injury).slice(0, 3);
        const tiredPlayers = team.squad.filter(p => p.isTitular && p.energy < 50);

        return (
            <div className="main-content fade-in">
                <div className="card" style={{ textAlign: 'center' }}>
                    <h2>⏸️ Intervalo</h2>
                    <div className="match-teams">
                        <span className="team-name">{result.home}</span>
                        <div className="match-score">{halfTimeData?.homeGoals ?? 0} — {halfTimeData?.awayGoals ?? 0}</div>
                        <span className="team-name">{result.away}</span>
                    </div>
                </div>

                {/* Tactical change */}
                {!tacticChanged && (
                    <div className="card">
                        <h3 style={{marginBottom:'0.5rem'}}>⚔️ Ajuste Tático</h3>
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
                    <div className="card">
                        <h3 style={{marginBottom:'0.5rem'}}>🔄 Substituição</h3>
                        <p style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.5rem'}}>Jogadores cansados:</p>
                        {tiredPlayers.slice(0, 2).map(p => (
                            <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.3rem',marginBottom:'0.25rem'}}>
                                <span style={{color:'var(--danger)',fontSize:'0.85rem'}}>{p.name} (⚡{p.energy}%)</span>
                                <button className="btn btn-primary btn-sm" onClick={() => {
                                    const sub = subs[0];
                                    if (sub) {
                                        p.isTitular = false;
                                        sub.isTitular = true;
                                        sub.energy = Math.min(100, sub.energy + 15); // fresh sub bonus
                                        setSubUsed(true);
                                        forceUpdate();
                                    }
                                }}>← {subs[0]?.name} (⚡{subs[0]?.energy}%)</button>
                            </div>
                        ))}
                    </div>
                )}

                <button className="btn btn-primary" style={{width:'100%',marginTop:'0.5rem'}} onClick={() => {
                    // Show second half narration
                    const secondHalf = narration.filter(e => e.minute > 45);
                    setVisibleNarr(secondHalf);
                    setPhase('secondhalf');
                }}>
                    ▶️ Continuar (2º Tempo)
                </button>
            </div>
        );
    }

    // === SECOND HALF ===
    if (phase === 'secondhalf') {
        return (
            <div className="main-content fade-in">
                <div className="card" style={{ textAlign: 'center' }}>
                    <div className="match-teams">
                        <span className="team-name">{result.home}</span>
                        <div className="match-score">{result.homeGoals} — {result.awayGoals}</div>
                        <span className="team-name">{result.away}</span>
                    </div>
                    <p style={{color:'var(--accent)',fontSize:'0.8rem'}}>2º Tempo</p>
                </div>

                <div className="narration-log">
                    {visibleNarr.map((n, i) => (
                        <div key={i} className={n.text?.includes('GOOOL') ? 'goal-line' : ''}>{n.minute}' — {n.text}</div>
                    ))}
                </div>

                <button className="btn btn-primary" style={{width:'100%',marginTop:'0.5rem'}} onClick={() => setPhase('fulltime')}>
                    🏁 Fim de Jogo
                </button>
            </div>
        );
    }

    // === FULL TIME — POST MATCH REPORT ===
    // Extract scorers and stats from last match narration
    const lastMatchScorers = narration.filter(n => n.text?.includes('⚽'));
    const lastMatchCards = narration.filter(n => n.text?.includes('🟨'));
    const motmEntry = narration.find(n => n.text?.includes('⭐ Craque'));

    return (
        <div className="main-content fade-in">
            <div className="card" style={{ textAlign: 'center' }}>
                <h2>🏁 Fim de Jogo</h2>
                <div className="match-teams">
                    <span className="team-name">{result?.home}</span>
                    <div className="match-score">{result?.homeGoals} — {result?.awayGoals}</div>
                    <span className="team-name">{result?.away}</span>
                </div>
                {motmEntry && <p style={{color:'var(--primary)',fontSize:'0.85rem',marginTop:'0.5rem'}}>{motmEntry.text}</p>}
            </div>

            {/* Scorers */}
            {lastMatchScorers.length > 0 && (
                <div className="card">
                    <h3 style={{marginBottom:'0.5rem'}}>⚽ Gols</h3>
                    {lastMatchScorers.map((s, i) => (
                        <p key={i} style={{fontSize:'0.8rem',color:'var(--text-main)',marginBottom:'0.2rem'}}>{s.minute}' — {s.text}</p>
                    ))}
                </div>
            )}

            {/* Post-Match Report */}
            <div className="card">
                <h3 style={{marginBottom:'0.5rem'}}>📊 Estatísticas</h3>
                <ul className="stats-list">
                    {matchStats && <>
                        <li><span>Finalizações:</span> <strong>{matchStats.totalChances}</strong></li>
                        <li><span>Gols:</span> <strong>{matchStats.goals}</strong></li>
                    </>}
                    <li><span>Tática:</span> <strong>{TACTICS[engine.currentTactic]?.name}</strong></li>
                    {engine.weekInjuries.length > 0 && (
                        <li><span>🏥 Lesões:</span> <strong style={{color:'var(--danger)'}}>{engine.weekInjuries.length}</strong></li>
                    )}
                    {lastMatchCards.length > 0 && (
                        <li><span>🟨 Cartões:</span> <strong>{lastMatchCards.length}</strong></li>
                    )}
                </ul>

                {/* Injuries */}
                {engine.weekInjuries.length > 0 && (
                    <div style={{marginTop:'0.5rem'}}>
                        <h4 style={{fontSize:'0.8rem',marginBottom:'0.25rem'}}>🏥 Lesões</h4>
                        {engine.weekInjuries.map((inj, i) => (
                            <p key={i} style={{color:'var(--danger)',fontSize:'0.8rem'}}>{inj.emoji} {inj.player} — {inj.name} ({inj.weeksLeft} semanas)</p>
                        ))}
                    </div>
                )}

                {/* Cards */}
                {lastMatchCards.length > 0 && (
                    <div style={{marginTop:'0.5rem'}}>
                        <h4 style={{fontSize:'0.8rem',marginBottom:'0.25rem'}}>🟨 Cartões</h4>
                        {lastMatchCards.map((c, i) => (
                            <p key={i} style={{fontSize:'0.75rem',color:'var(--accent)'}}>{c.minute}' — {c.text}</p>
                        ))}
                    </div>
                )}

                {/* Board reaction */}
                {engine.board && (
                    <div style={{marginTop:'0.75rem',borderTop:'1px solid var(--border-subtle)',paddingTop:'0.5rem'}}>
                        <p style={{fontSize:'0.8rem',color: engine.board.getStatus().color}}>
                            {engine.board.getStatus().emoji} Diretoria: {engine.board.getStatus().label} ({engine.board.confidence}%)
                        </p>
                    </div>
                )}

                {/* Week Events */}
                {engine.weekEvents.length > 0 && (
                    <div style={{marginTop:'0.75rem',borderTop:'1px solid var(--border-subtle)',paddingTop:'0.5rem'}}>
                        <h4 style={{fontSize:'0.8rem',marginBottom:'0.25rem'}}>📰 Eventos</h4>
                        {engine.weekEvents.map((ev, i) => (
                            <p key={i} style={{fontSize:'0.75rem',color:'var(--text-muted)',marginBottom:'0.15rem'}}>{ev}</p>
                        ))}
                    </div>
                )}
            </div>

            <button className="btn btn-primary" style={{width:'100%'}} onClick={() => { setPhase('prematch'); setResult(null); changeView('dashboard'); }}>
                📊 Voltar ao Dashboard
            </button>
        </div>
    );
}
