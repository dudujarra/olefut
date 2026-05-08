import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { OffPitchEventsDeck } from '../engine/OffPitchEventsDeck';
import { PERSONALITIES } from '../engine/PlayerCareer';
import { EfClubBadge, EfBanner } from './ui';

export function PlayerDashboardView() {
    const { getEngine, changeView, forceUpdate } = useGame();
    const engine = getEngine();
    const player = engine.proPlayer;
    const team = engine.getTeam(engine.manager.teamId);
    const [log, setLog] = useState('');
    const [offPitchEvent, setOffPitchEvent] = useState(null);
    const [offPitchResult, setOffPitchResult] = useState(null);
    const [mentalBreakModal, setMentalBreakModal] = useState(false);
    const [banner, setBanner] = useState(null);
    const prevTeamIdRef = React.useRef(player?.teamId ?? null);
    const prevRetiredRef = React.useRef(player?._retired ?? false);
    const prevMotmRef = React.useRef(player?.career?.seasonMotm ?? 0);

    if (!player || !team) return <div className="main-content">Erro: jogador não encontrado.</div>;

    // Check for off-pitch event on mount
    React.useEffect(() => {
        const eligible = OffPitchEventsDeck.filter(e => !e.trigger || e.trigger(player));
        if (eligible.length > 0 && Math.random() < 0.4) {
            setOffPitchEvent(eligible[Math.floor(Math.random() * eligible.length)]);
        }
    }, [engine.currentWeek]);

    // Banner triggers: hired (team change) / retirement / motm
    React.useEffect(() => {
        if (player.teamId !== prevTeamIdRef.current && prevTeamIdRef.current !== null) {
            setBanner('hired');
        }
        prevTeamIdRef.current = player.teamId;

        if (player._retired && !prevRetiredRef.current) {
            setBanner('retirement');
        }
        prevRetiredRef.current = player._retired;

        const motm = player.career?.seasonMotm ?? 0;
        if (motm > prevMotmRef.current) {
            setBanner('motm');
        }
        prevMotmRef.current = motm;
    });

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
        if (eff.stress) player.addStress(eff.stress, 'evento');
        // Chain Event Flags
        if (option.flags?.set) player.setFlag(option.flags.set);
        if (option.flags?.clear) player.clearFlag(option.flags.clear);
        // Check mental break
        if (player.mentalBreakActive) setMentalBreakModal(true);
        setOffPitchResult(option.resultText);
        setOffPitchEvent(null);
        forceUpdate();
    };

    const handleMentalBreak = (choice) => {
        player.resolveMentalBreak(choice);
        setMentalBreakModal(false);
        setLog(`Mental break resolvido: ${choice}`);
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
    const pers = PERSONALITIES[player.personality] || PERSONALITIES.maverick;
    const stressColor = player.stress >= 75 ? 'var(--danger)' : player.stress >= 50 ? 'var(--accent)' : 'var(--text-muted)';

    return (
        <div className="main-content fade-in ef-art-bg ef-art-managers">
            {banner && <EfBanner type={banner} onDismiss={() => setBanner(null)} />}
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
                <div className="card-header" style={{display:'flex',alignItems:'center',gap:'12px'}}>
                    {team?.name && <EfClubBadge name={team.name} size="lg" />}
                    <div style={{flex:1}}>
                        <h2>{player.name} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{pers.emoji} {pers.name}</span></h2>
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
                            <li><span>🧠 Stress:</span> <strong className={player.stress >= 75 ? 'ef-anim-pulse-glow' : ''} style={{ color: stressColor, padding: player.stress >= 75 ? '2px 6px' : 0, borderRadius: '4px' }}>{player.stress}%</strong></li>
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

            {/* Mental Break Modal */}
            {mentalBreakModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>🧠 CRISE MENTAL — Stress em {player.stress}%</h3>
                        <p>Você não aguenta mais a pressão. Precisa de uma válvula de escape.</p>
                        <div className="modal-options">
                            <button className="btn btn-secondary" onClick={() => handleMentalBreak('party')}>🎉 Sair pra festa (Stress -40, Boss -10)</button>
                            <button className="btn btn-secondary" onClick={() => handleMentalBreak('isolation')}>🏠 Isolamento total (Stress -30, Team -8)</button>
                            <button className="btn btn-secondary" onClick={() => handleMentalBreak('therapy')}>🧑‍⚕️ Terapia R$2000 (Stress -20)</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Relationships */}
            <div className="card">
                <h3 style={{ marginBottom: '0.75rem' }}>Relacionamentos</h3>
                <RelBar label="👔 Marcos Oliveira" value={player.relationships.boss} type="boss" />
                <RelBar label="📣 Tio Dinho" value={player.relationships.fans} type="fans" />
                <RelBar label="🤝 Rafael Monteiro" value={player.relationships.teammates} type="teammates" />
                <RelBar label="💼 Patrícia Lemos" value={player.relationships.sponsors} type="sponsors" />
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
