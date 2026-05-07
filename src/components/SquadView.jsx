import React from 'react';
import { useGame } from '../context/GameContext';

export function SquadView() {
    const { gameState, changeView, getEngine, forceUpdate } = useGame();
    const engine = getEngine();
    const team = engine.getTeam(gameState.teamId);
    if (!team) return null;

    const posOrder = { GOL: 0, DEF: 1, MEI: 2, ATA: 3 };
    const sorted = [...team.squad].sort((a, b) => posOrder[a.position] - posOrder[b.position] || b.ovr - a.ovr);

    const toggleTitular = (playerId) => {
        const p = team.squad.find(x => x.id === playerId);
        if (p) { p.isTitular = !p.isTitular; forceUpdate(); }
    };

    const getEnergyColor = (e) => e > 60 ? 'var(--primary)' : e > 30 ? 'var(--accent)' : 'var(--danger)';

    const back = gameState.mode === 'player' ? 'player_dashboard' : 'dashboard';

    return (
        <div className="main-content fade-in">
            <div className="card-header" style={{ marginBottom: '1rem' }}>
                <h2>👥 Plantel — {team.name}</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => changeView(back)}>← Voltar</button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className="standings-table">
                    <thead>
                        <tr>
                            <th>Status</th><th>Nome</th><th>Pos</th><th>OVR</th>
                            <th>FIS</th><th>DEF</th><th>CRI</th><th>FIN</th><th>REF</th>
                            <th>⚡</th><th>Idade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map(p => (
                            <tr key={p.id} className={p.isTitular ? 'highlight' : ''}>
                                <td>
                                    <button className={`btn btn-sm ${p.isTitular ? 'btn-primary' : 'btn-secondary'}`} onClick={() => toggleTitular(p.id)}>
                                        {p.isTitular ? '⭐' : '🔄'}
                                    </button>
                                </td>
                                <td>{p.name}</td>
                                <td>{p.position}</td>
                                <td><strong>{p.ovr}</strong></td>
                                <td>{p.attributes.FIS}</td>
                                <td>{p.attributes.DEF}</td>
                                <td>{p.attributes.CRI}</td>
                                <td>{p.attributes.FIN}</td>
                                <td>{p.attributes.REF}</td>
                                <td style={{ color: getEnergyColor(p.energy) }}>{p.energy}%</td>
                                <td>{p.age}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
