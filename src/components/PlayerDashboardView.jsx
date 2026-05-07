import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { OffPitchEventsDeck } from '../engine/OffPitchEventsDeck';

export function PlayerDashboardView() {
    const { getEngine, changeView, forceUpdate } = useGame();
    const engine = getEngine();
    const player = engine.proPlayer;
    const team = engine.getTeam(engine.manager.teamId);
    const [log, setLog] = useState('');
    const [offPitchEvent, setOffPitchEvent] = useState(null);
    const [offPitchResult, setOffPitchResult] = useState(null);

    if (!player || !team) return <div className="main-content">Erro: jogador não encontrado.</div>;

    // Check for off-pitch event on mount
    React.useEffect(() => {
        const eligible = OffPitchEventsDeck.filter(e => !e.trigger || e.trigger(player));
        if (eligible.length > 0 && Math.random() < 0.4) {
            setOffPitchEvent(eligible[Math.floor(Math.random() * eligible.length)]);
        }
    }, [engine.currentWeek]);

    const handleTrain = (skill) => {
        const result = player.train(skill);
        setLog(result.msg);
        forceUpdate();
    };

    const handleRest = () => {
        const result = player.rest();
        setLog(result.msg);
        forceUpdate();
    };

    const handleBuyDrink = () => {
        const result = player.buyEnergyDrink();
        setLog(result.msg);
        forceUpdate();
    };

    const handleUseDrink = () => {
        const result = player.consumeEnergyDrink();
        setLog(result.msg);
        forceUpdate();
    };

    const handleOffPitchChoice = (option) => {
        const eff = option.effect;
        if (eff.boss) player.relationships.boss = Math.max(0, Math.min(100, player.relationships.boss + eff.boss));
        if (eff.fans) player.relationships.fans = Math.max(0, Math.min(100, player.relationships.fans + eff.fans));
        if (eff.teammates) player.relationships.teammates = Math.max(0, Math.min(100, player.relationships.teammates + eff.teammates));
        if (eff.sponsors) player.relationships.sponsors = Math.max(0, Math.min(100, player.relationships.sponsors + eff.sponsors));
        if (eff.money) player.money += eff.money;
        if (eff.energy) player.energy = Math.max(0, Math.min(100, player.energy + eff.energy));
        if (eff.actionSlots) player.actionSlots = Math.max(0, player.actionSlots + eff.actionSlots);
        if (eff.wage_multiplier) player.wage = Math.floor(player.wage * eff.wage_multiplier);
        setOffPitchResult(option.resultText);
        setOffPitchEvent(null);
        forceUpdate();
    };

    const handleAdvance = () => changeView('player_match');

    const RelBar = ({ label, value, type }) => (
        <div className="rel-bar">
            <label><span>{label}</span><span>{value}%</span></label>
            <div className="bar"><div className={`bar-fill ${type}`} style={{ width: `${value}%` }} /></div>
        </div>
    );

    const starStr = '⭐'.repeat(player.starRating) + '☆'.repeat(5 - player.starRating);

    return (
        <div className="main-content fade-in">
            {/* Off-Pitch Event Modal */}
            {offPitchEvent && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>📰 Evento da Semana</h3>
                        <p>{offPitchEvent.text}</p>
                        <div className="modal-options">
                            {offPitchEvent.options.map((opt, i) => (
                                <button key={i} className="btn btn-secondary" onClick={() => handleOffPitchChoice(opt)}>{opt.label}</button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Header Card */}
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2>{player.name}</h2>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{player.position} • {team.name} • Semana {engine.currentWeek}/38</span>
                    </div>
                    <div className="stars">{starStr}</div>
                </div>
                <div className="grid-2">
                    <div>
                        <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>AÇÕES RESTANTES</div>
                        <div className="slot-indicator">
                            {Array.from({ length: player.maxActionSlots }).map((_, i) => (
                                <div key={i} className={`slot-dot ${i < player.actionSlots ? 'active' : ''}`} />
                            ))}
                        </div>
                        <ul className="stats-list" style={{ marginTop: '0.5rem' }}>
                            <li><span>⚡ Energia:</span> <strong style={{ color: player.energy < 30 ? 'var(--danger)' : 'var(--primary)' }}>{player.energy}%</strong></li>
                            <li><span>💰 Dinheiro:</span> <strong>R$ {player.money}</strong></li>
                            <li><span>🥤 Energéticos:</span> <strong>{player.energyDrinks}</strong></li>
                            <li><span>⚽ Gols:</span> <strong>{player.seasonGoals}</strong></li>
                        </ul>
                    </div>
                    <div>
                        <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKILLS</div>
                        <ul className="stats-list">
                            <li><span>🎯 Technique:</span> <strong>{player.skills.technique}</strong></li>
                            <li><span>💨 Pace:</span> <strong>{player.skills.pace}</strong></li>
                            <li><span>💪 Power:</span> <strong>{player.skills.power}</strong></li>
                            <li><span>👁️ Vision:</span> <strong>{player.skills.vision}</strong></li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Relationships */}
            <div className="card">
                <h3 style={{ marginBottom: '0.75rem' }}>Relacionamentos</h3>
                <RelBar label="👔 Técnico" value={player.relationships.boss} type="boss" />
                <RelBar label="🏟️ Torcida" value={player.relationships.fans} type="fans" />
                <RelBar label="🤝 Companheiros" value={player.relationships.teammates} type="teammates" />
                <RelBar label="💼 Sponsors" value={player.relationships.sponsors} type="sponsors" />
            </div>

            {/* Actions */}
            <div className="card">
                <h3 style={{ marginBottom: '0.75rem' }}>Ações da Semana</h3>
                {player.isBenched && <div className="bench-warning">🔴 Você está no BANCO! Recupere energia ou melhore sua relação com o técnico.</div>}
                <div className="action-bar">
                    <button className="btn btn-primary btn-sm" onClick={() => handleTrain('technique')} disabled={!player.canAct}>🎯 Treinar TEC</button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleTrain('pace')} disabled={!player.canAct}>💨 Treinar PAC</button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleTrain('power')} disabled={!player.canAct}>💪 Treinar POW</button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleTrain('vision')} disabled={!player.canAct}>👁️ Treinar VIS</button>
                    <button className="btn btn-accent btn-sm" onClick={handleRest} disabled={!player.canAct}>😴 Descansar</button>
                    <button className="btn btn-secondary btn-sm" onClick={handleBuyDrink}>🛒 Energético (R$100)</button>
                    <button className="btn btn-secondary btn-sm" onClick={handleUseDrink} disabled={player.energyDrinks <= 0}>🥤 Usar Energético</button>
                </div>
                {log && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{log}</p>}
                {offPitchResult && <p style={{ color: 'var(--accent)', fontSize: '0.8rem', marginTop: '0.5rem' }}>📰 {offPitchResult}</p>}
            </div>

            <button className="btn btn-primary" onClick={handleAdvance} style={{ width: '100%' }}>
                ⚽ AVANÇAR PARA A PARTIDA (Semana {engine.currentWeek + 1})
            </button>

            <div style={{ marginTop: '1rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => changeView('standings')}>📊 Tabela</button>
            </div>
        </div>
    );
}
