import React from 'react';
import { useGame } from '../context/GameContext';

export function MarketView() {
    const { gameState, changeView, getEngine, forceUpdate } = useGame();
    const engine = getEngine();
    const team = engine.getTeam(gameState.teamId);
    if (!team) return null;

    const handleBuy = (player) => {
        if (team.balance < player.value) return;
        team.balance -= player.value;
        team.squad.push({ ...player, isTitular: false });
        engine.marketPlayers = engine.marketPlayers.filter(p => p.id !== player.id);
        forceUpdate();
    };

    return (
        <div className="main-content fade-in">
            <div className="card-header" style={{ marginBottom: '1rem' }}>
                <h2>🛒 Mercado de Transferências</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => changeView('dashboard')}>← Voltar</button>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                Saldo: <strong style={{ color: 'var(--primary)' }}>R$ {(team.balance / 1000000).toFixed(1)}M</strong>
            </p>

            <div style={{ overflowX: 'auto' }}>
                <table className="standings-table">
                    <thead>
                        <tr><th>Nome</th><th>Pos</th><th>OVR</th><th>Idade</th><th>Valor</th><th></th></tr>
                    </thead>
                    <tbody>
                        {engine.marketPlayers.map(p => (
                            <tr key={p.id}>
                                <td>{p.name}</td>
                                <td>{p.position}</td>
                                <td><strong>{p.ovr}</strong></td>
                                <td>{p.age}</td>
                                <td>R$ {(p.value / 1000000).toFixed(1)}M</td>
                                <td>
                                    <button className="btn btn-primary btn-sm" onClick={() => handleBuy(p)} disabled={team.balance < p.value}>
                                        Contratar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
