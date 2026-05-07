import React from 'react';
import { useGame } from '../context/GameContext';
import { getFormEmoji } from '../engine/PlayerDevelopment';

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

    const handleLoan = (playerId) => {
        const result = engine.loanPlayer(playerId);
        if (result.success) forceUpdate();
    };

    const handleSell = (player) => {
        const price = player.value || (player.ovr * 100000);
        team.balance += price;
        team.squad = team.squad.filter(p => p.id !== player.id);
        forceUpdate();
    };

    const getEnergyColor = (e) => e > 60 ? 'var(--primary)' : e > 30 ? 'var(--accent)' : 'var(--danger)';
    const getMoralEmoji = (m) => m > 70 ? '😊' : m > 40 ? '😐' : '😞';

    const back = gameState.mode === 'player' ? 'player_dashboard' : 'dashboard';

    // Loaned out players
    const loanedOut = engine.loanedOut || [];

    return (
        <div className="main-content fade-in">
            <div className="card-header" style={{ marginBottom: '1rem' }}>
                <h2>👥 Plantel — {team.name} ({team.squad.length} jogadores)</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => changeView(back)}>← Voltar</button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className="standings-table">
                    <thead>
                        <tr>
                            <th>Status</th><th>Nome</th><th>Pos</th><th>OVR</th>
                            <th>⚡</th><th>😊</th><th>🔥</th><th>Idade</th><th>📋</th><th>🏥</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map(p => (
                            <tr key={p.id} className={p.isTitular ? 'highlight' : ''} style={p.injury ? {opacity: 0.6} : {}}>
                                <td>
                                    <button
                                        className={`btn btn-sm ${p.isTitular ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => toggleTitular(p.id)}
                                        disabled={!!p.injury}
                                    >
                                        {p.injury ? '🏥' : p.isTitular ? '⭐' : '🔄'}
                                    </button>
                                </td>
                                <td>
                                    {p.name}
                                    {p._isCaptain && <span style={{marginLeft:'3px'}} title="Capitão">©️</span>}
                                    {p.isYouth && <span style={{color:'var(--accent)',fontSize:'0.7rem',marginLeft:'4px'}}>🎓</span>}
                                    {p.personality && <span style={{color:'var(--text-muted)',fontSize:'0.65rem',marginLeft:'4px'}}>({p.personality})</span>}
                                </td>
                                <td>{p.position}</td>
                                <td><strong>{p.ovr}</strong></td>
                                <td style={{ color: getEnergyColor(p.energy) }}>{p.energy}%</td>
                                <td>{getMoralEmoji(p.moral || 50)} {(p.moral || 50)}%</td>
                                <td>{getFormEmoji(p.form?.trend)}</td>
                                <td>{p.age}</td>
                                <td style={{color: p.contract?.weeksLeft <= 8 ? 'var(--danger)' : 'var(--text-muted)', fontSize: '0.75rem'}}>
                                    {p.contract ? `${p.contract.weeksLeft}sem` : '-'}
                                </td>
                                <td style={{fontSize: '0.75rem'}}>
                                    {p.injury ? (
                                        <span style={{color:'var(--danger)'}}>{p.injury.emoji} {p.injury.weeksLeft}sem</span>
                                    ) : '-'}
                                </td>
                                <td>
                                    <div style={{display:'flex',gap:'0.25rem'}}>
                                        {!p.isTitular && !p.injury && p.age <= 23 && (
                                            <button className="btn btn-sm btn-secondary" onClick={() => handleLoan(p.id)} title="Emprestar">📤</button>
                                        )}
                                        {!p.isTitular && (
                                            <button className="btn btn-sm btn-danger" onClick={() => handleSell(p)} title="Vender">💰</button>
                                        )}
                                        {p.contract && p.contract.weeksLeft <= 12 && (
                                            <button className="btn btn-sm btn-primary" onClick={() => {
                                                const result = engine.renewContract(p.id);
                                                if (result.success) forceUpdate();
                                            }} title="Renovar">📝</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Loaned Out */}
            {loanedOut.length > 0 && (
                <div className="card" style={{marginTop:'1rem'}}>
                    <h3 style={{marginBottom:'0.5rem'}}>📤 Emprestados ({loanedOut.length})</h3>
                    <ul className="stats-list">
                        {loanedOut.map((l, i) => (
                            <li key={i}>
                                <span>{l.playerName} → {l.destination}</span>
                                <strong style={{color:'var(--text-muted)'}}>{l.weeksLeft}/{l.totalWeeks} sem</strong>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
