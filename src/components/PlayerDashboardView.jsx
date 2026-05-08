import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { OffPitchEventsDeck } from '../engine/OffPitchEventsDeck';
import { PERSONALITIES, TRAITS_CATALOG, LIFESTYLE_CATALOG, SUB_ATTRIBUTES } from '../engine/PlayerCareer';
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
    const [showSubAttrs, setShowSubAttrs] = useState(false);
    const prevTeamIdRef = React.useRef(player?.teamId ?? null);
    const prevRetiredRef = React.useRef(player?._retired ?? false);
    const prevMotmRef = React.useRef(player?.career?.seasonMotm ?? 0);

    // BUG-021 fix: useEffects MUST come before early return (Rules of Hooks)
    // React error #310 ("Rendered more hooks than during previous render") fires
    // when player/team transitions null→exists across renders.

    // Check for off-pitch event on mount
    React.useEffect(() => {
        if (!player) return;
        const eligible = OffPitchEventsDeck.filter(e => !e.trigger || e.trigger(player));
        if (eligible.length > 0 && Math.random() < 0.4) {
            setOffPitchEvent(eligible[Math.floor(Math.random() * eligible.length)]);
        }
    }, [engine.currentWeek, player]);

    // Banner triggers: hired (team change) / retirement / motm
    React.useEffect(() => {
        if (!player) return;
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

    if (!player || !team) return <div className="main-content">Erro: jogador não encontrado.</div>;

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

    const handleBuyTrait = (traitId) => {
        const result = player.buyTrait(traitId);
        setLog(result.msg);
        forceUpdate();
    };

    const handleBuyLifestyle = (itemId) => {
        const result = player.buyLifestyle(itemId);
        setLog(result.msg);
        forceUpdate();
    };

    const handleTrainSubAttr = (subAttr) => {
        if (!player.trainSubAttr) return;
        const result = player.trainSubAttr(subAttr);
        setLog(result.msg);
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
                        <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKILLS (progresso pro próximo nível)</div>
                        {[
                            { key: 'technique', label: '🎯 TEC' },
                            { key: 'pace',      label: '💨 PAC' },
                            { key: 'power',     label: '💪 POW' },
                            { key: 'vision',    label: '👁️ VIS' }
                        ].map(s => {
                            const lvl = player.skills[s.key] ?? 0;
                            const prog = player.skillProgress?.[s.key] ?? 0;
                            return (
                                <div key={s.key} style={{ marginBottom: '6px' }}>
                                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem' }}>
                                        <span>{s.label} <strong>{lvl}</strong></span>
                                        <span style={{ color:'var(--text-muted)' }}>{prog}/100 XP</span>
                                    </div>
                                    <div style={{
                                        height: '6px',
                                        background: 'var(--bg-elevated, #1a2520)',
                                        borderRadius: '3px',
                                        overflow: 'hidden',
                                        border: '1px solid var(--border-subtle, #2a3530)'
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${prog}%`,
                                            background: 'linear-gradient(90deg, #6ABC3A, #FFD700)',
                                            transition: 'width 200ms ease-out'
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
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

            {/* Loja de Traits — uso de dinheiro modo carreira */}
            <div className="card">
                <h3 style={{ marginBottom: '0.5rem' }}>🛍️ Loja de Traits Especiais</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0' }}>
                    Habilidades únicas. Custam dinheiro + aprovação do técnico. Saldo atual: <strong>R$ {player.money}</strong>
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                    {Object.entries(TRAITS_CATALOG).map(([id, t]) => {
                        const owned = player.traits?.includes(id);
                        const canAfford = player.money >= t.cost;
                        const bossOk = player.relationships.boss >= t.requiredBoss;
                        const disabled = owned || !canAfford || !bossOk;
                        return (
                            <div key={id} style={{
                                border: '1px solid var(--border-subtle, #2a3530)',
                                borderRadius: '4px',
                                padding: '0.5rem',
                                background: owned ? 'rgba(106,188,58,0.1)' : 'transparent',
                                opacity: disabled && !owned ? 0.7 : 1
                            }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '2px' }}>
                                    {owned ? '✅ ' : ''}{t.name}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                    {t.description}
                                </div>
                                <div style={{ fontSize: '0.7rem', display: 'flex', gap: '8px', marginBottom: '6px' }}>
                                    <span style={{ color: canAfford ? 'var(--primary)' : 'var(--danger)' }}>
                                        💰 R$ {t.cost}
                                    </span>
                                    <span style={{ color: bossOk ? 'var(--primary)' : 'var(--danger)' }}>
                                        👔 {t.requiredBoss}%
                                    </span>
                                </div>
                                <button
                                    className={`btn btn-sm ${owned ? 'btn-secondary' : 'btn-primary'}`}
                                    onClick={() => handleBuyTrait(id)}
                                    disabled={disabled}
                                    style={{ width: '100%', fontSize: '0.7rem' }}
                                >
                                    {owned ? 'ADQUIRIDO' : !canAfford ? 'SEM DINHEIRO' : !bossOk ? 'TÉCNICO BAIXO' : 'COMPRAR'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SPEC-062 Sub-Attributes Panel (16 granular) */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0 }}>🎯 Sub-Atributos (16 detalhados)</h3>
                    <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setShowSubAttrs(!showSubAttrs)}
                    >
                        {showSubAttrs ? 'Ocultar' : 'Mostrar'}
                    </button>
                </div>
                {showSubAttrs && player.subAttrs && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '6px' }}>
                        {Object.entries(SUB_ATTRIBUTES).map(([base, subs]) => (
                            <div key={base} style={{ border: '1px solid var(--border-subtle, #2a3530)', borderRadius: '4px', padding: '6px' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '4px', textTransform: 'uppercase' }}>{base}</div>
                                {subs.map(sub => {
                                    const lvl = player.subAttrs[sub] ?? 0;
                                    const prog = player.subAttrProgress?.[sub] ?? 0;
                                    return (
                                        <div key={sub} style={{ marginBottom: '4px' }}>
                                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.7rem' }}>
                                                <span>{sub} <strong>{lvl}</strong></span>
                                                <button
                                                    onClick={() => handleTrainSubAttr(sub)}
                                                    disabled={!player.canAct}
                                                    style={{
                                                        fontSize:'0.6rem',
                                                        padding:'1px 6px',
                                                        background:'var(--accent)',
                                                        color:'#0F1A14',
                                                        border:'none',
                                                        borderRadius:'2px',
                                                        cursor: player.canAct ? 'pointer' : 'not-allowed',
                                                        opacity: player.canAct ? 1 : 0.5
                                                    }}
                                                >TREINAR</button>
                                            </div>
                                            <div style={{ height:'3px', background:'#1a2520', borderRadius:'2px', overflow:'hidden' }}>
                                                <div style={{ height:'100%', width:`${prog}%`, background:'#6ABC3A' }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SPEC-065 Loja Lifestyle — casa, carro, festas, caridade, investimentos, casamento */}
            <div className="card">
                <h3 style={{ marginBottom: '0.5rem' }}>🏛️ Lifestyle — Use Seu Dinheiro</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0' }}>
                    🏠 {player.lifestyle?.ownedHouse ? LIFESTYLE_CATALOG[player.lifestyle.ownedHouse]?.name : 'Sem casa'} •
                    🚗 {player.lifestyle?.ownedCar ? LIFESTYLE_CATALOG[player.lifestyle.ownedCar]?.name : 'Sem carro'} •
                    💑 {player.lifestyle?.isMarried ? 'Casado' : 'Solteiro'} •
                    😊 Mood {player.lifestyle?.mood ?? 50}%
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '6px' }}>
                    {Object.entries(LIFESTYLE_CATALOG).map(([id, it]) => {
                        const owned = (it.type === 'house' && player.lifestyle?.ownedHouse === id) ||
                                      (it.type === 'car' && player.lifestyle?.ownedCar === id) ||
                                      (it.type === 'event' && id === 'wedding' && player.lifestyle?.isMarried);
                        const canAfford = player.money >= it.cost;
                        const disabled = owned || !canAfford;
                        return (
                            <div key={id} style={{
                                border: '1px solid var(--border-subtle, #2a3530)',
                                borderRadius: '4px',
                                padding: '6px',
                                opacity: disabled && !owned ? 0.65 : 1,
                                background: owned ? 'rgba(106,188,58,0.1)' : 'transparent'
                            }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                                    {it.emoji} {owned ? '✅ ' : ''}{it.name}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: canAfford ? 'var(--primary)' : 'var(--danger)', margin: '2px 0' }}>
                                    R$ {it.cost.toLocaleString('pt-BR')}
                                </div>
                                <button
                                    className={`btn btn-sm ${owned ? 'btn-secondary' : 'btn-primary'}`}
                                    onClick={() => handleBuyLifestyle(id)}
                                    disabled={disabled}
                                    style={{ width: '100%', fontSize: '0.65rem', padding: '4px' }}
                                >
                                    {owned ? 'TEM' : !canAfford ? 'POBRE' : it.oneShot ? 'FAZER' : 'COMPRAR'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <button className="btn btn-primary" onClick={handleAdvance} style={{ width: '100%' }}>
                ⚽ AVANÇAR PARA A PARTIDA (Semana {engine.currentWeek + 1})
            </button>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => changeView('standings')}>📊 Tabela</button>
                <button className="btn btn-secondary btn-sm" onClick={() => changeView('achievements')}>🏆 Conquistas</button>
            </div>
        </div>
    );
}
