import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

export function StandingsView() {
    const { gameState, changeView, getEngine } = useGame();
    const engine = getEngine();
    const userTeam = engine.getTeam(gameState.teamId);
    const [activeZone, setActiveZone] = useState(userTeam?.zone || 'BRA');
    const [activeDiv, setActiveDiv] = useState(userTeam?.division || 1);

    const standings = engine.getStandings(activeZone, activeDiv);

    // Get all zones
    const zones = [...new Set(engine.teams.map(t => t.zone))];
    // Get divisions for active zone
    const divs = [...new Set(engine.teams.filter(t => t.zone === activeZone).map(t => t.division))].sort();

    const back = gameState.mode === 'player' ? 'player_dashboard' : 'dashboard';

    return (
        <div className="main-content fade-in">
            <div className="card-header" style={{ marginBottom: '1rem' }}>
                <h2>📊 Classificação</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => changeView(back)}>← Voltar</button>
            </div>

            <div className="nav-tabs">
                {zones.map(z => (
                    <button key={z} className={`nav-tab ${activeZone === z ? 'active' : ''}`} onClick={() => { setActiveZone(z); setActiveDiv(1); }}>
                        {z}
                    </button>
                ))}
            </div>

            {divs.length > 1 && (
                <div className="nav-tabs">
                    {divs.map(d => (
                        <button key={d} className={`nav-tab ${activeDiv === d ? 'active' : ''}`} onClick={() => setActiveDiv(d)}>
                            Div {d}
                        </button>
                    ))}
                </div>
            )}

            <div style={{ overflowX: 'auto' }}>
                <table className="standings-table">
                    <thead>
                        <tr><th>#</th><th>Time</th><th>P</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th></tr>
                    </thead>
                    <tbody>
                        {standings.map((s, i) => {
                            const t = engine.getTeam(s.teamId);
                            return (
                                <tr key={s.teamId} className={s.teamId === userTeam?.id ? 'highlight' : ''}>
                                    <td>{i + 1}</td>
                                    <td>{t?.name || `Time ${s.teamId}`}</td>
                                    <td><strong>{s.points}</strong></td>
                                    <td>{s.played}</td>
                                    <td>{s.won}</td>
                                    <td>{s.drawn}</td>
                                    <td>{s.lost}</td>
                                    <td>{s.goalsFor}</td>
                                    <td>{s.goalsAgainst}</td>
                                    <td>{s.goalsFor - s.goalsAgainst}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
