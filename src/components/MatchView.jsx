import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

export function MatchView() {
    const { gameState, changeView, getEngine, forceUpdate } = useGame();
    const engine = getEngine();
    const team = engine.getTeam(gameState.teamId);
    const [result, setResult] = useState(null);
    const [narration, setNarration] = useState([]);
    const [showNarration, setShowNarration] = useState(false);

    const handlePlay = () => {
        const weekResults = engine.advanceWeek();
        let myMatch = null;

        for (const tId in weekResults) {
            const match = weekResults[tId].find(m =>
                (m.home === team.id || m.away === team.id) && m.score
            );
            if (match) {
                myMatch = match;
                break;
            }
        }

        if (myMatch && myMatch.score) {
            const isHome = myMatch.home === team.id;
            const opponent = engine.getTeam(isHome ? myMatch.away : myMatch.home);
            setResult({
                home: isHome ? team.name : opponent.name,
                away: isHome ? opponent.name : team.name,
                homeGoals: myMatch.score.homeGoals,
                awayGoals: myMatch.score.awayGoals,
                log: myMatch.score.events?.textLog || []
            });
            setNarration(myMatch.score.events?.textLog || []);
        } else {
            setResult({ home: team.name, away: 'Sem Jogo', homeGoals: '-', awayGoals: '-', log: [] });
        }
        forceUpdate();
    };

    return (
        <div className="main-content fade-in">
            {!result ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <h2>Semana {engine.currentWeek + 1}</h2>
                    <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>{team.name} entra em campo!</p>
                    <button className="btn btn-primary" onClick={handlePlay}>⚽ Simular Partida</button>
                </div>
            ) : (
                <>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <div className="match-teams">
                            <span className="team-name">{result.home}</span>
                            <div className="match-score">{result.homeGoals} — {result.awayGoals}</div>
                            <span className="team-name">{result.away}</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>FIM DE JOGO</p>
                    </div>

                    {narration.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowNarration(!showNarration)}>
                                {showNarration ? '🔼 Esconder Narração' : '🔽 Ver Narração'}
                            </button>
                            {showNarration && (
                                <div className="narration-log" style={{ marginTop: '0.5rem' }}>
                                    {narration.map((n, i) => (
                                        <div key={i} className={n.text.includes('GOOOL') ? 'goal-line' : ''}>{n.minute}' — {n.text}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <button className="btn btn-primary" onClick={() => { setResult(null); changeView('dashboard'); }} style={{ width: '100%' }}>
                        📊 Voltar ao Dashboard
                    </button>
                </>
            )}
        </div>
    );
}
