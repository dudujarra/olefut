import React from 'react';
import { useGame } from '../context/GameContext';

export function DashboardView() {
    const { gameState, changeView, getEngine } = useGame();
    const engine = getEngine();
    const team = engine.getTeam(gameState.teamId);
    if (!team) return <div className="main-content">Time não encontrado.</div>;

    const sectors = engine.getTeamSectors(team.id);
    const standings = engine.getStandings(team.zone, team.division);
    const pos = standings.findIndex(s => s.teamId === team.id) + 1;

    return (
        <div className="main-content fade-in">
            <div className="card">
                <div className="card-header">
                    <h2>{team.name}</h2>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Semana {engine.currentWeek}/38</span>
                </div>
                <div className="grid-2">
                    <ul className="stats-list">
                        <li><span>Formação:</span> <strong>{team.formation}</strong></li>
                        <li><span>Divisão:</span> <strong>Série {['A','B','C','D'][team.division - 1]} ({team.zone})</strong></li>
                        <li><span>Posição:</span> <strong>{pos}º lugar</strong></li>
                        <li><span>Saldo:</span> <strong style={{ color: team.balance > 0 ? 'var(--primary)' : 'var(--danger)' }}>R$ {(team.balance / 1000000).toFixed(1)}M</strong></li>
                    </ul>
                    <ul className="stats-list">
                        <li><span>🧤 GOL:</span> <strong>{sectors.goalkeeper}</strong></li>
                        <li><span>🛡️ DEF:</span> <strong>{sectors.defense}</strong></li>
                        <li><span>🎯 MEI:</span> <strong>{sectors.midfield}</strong></li>
                        <li><span>⚡ ATA:</span> <strong>{sectors.attack}</strong></li>
                    </ul>
                </div>
            </div>

            <div className="action-bar">
                <button className="btn btn-primary" onClick={() => changeView('match')}>⚽ Jogar Partida</button>
                <button className="btn btn-secondary" onClick={() => changeView('squad')}>👥 Plantel</button>
                <button className="btn btn-secondary" onClick={() => changeView('market')}>🛒 Mercado</button>
                <button className="btn btn-secondary" onClick={() => changeView('standings')}>📊 Tabela</button>
            </div>
        </div>
    );
}
