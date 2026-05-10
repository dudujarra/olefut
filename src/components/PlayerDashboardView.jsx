import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { OffPitchEventsDeck } from '../engine/OffPitchEventsDeck';
import { PERSONALITIES, TRAITS_CATALOG, LIFESTYLE_CATALOG, SUB_ATTRIBUTES } from '../engine/PlayerCareer';
import { EfClubBadge, EfBanner } from './ui';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';
import bgPlayerDashboard from '../assets/environments/bg_player_dashboard.png';

import { rng as systemRng } from '../engine/rng.js';

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
        // BUG-024 belt-and-suspenders: trigger may call player.hasFlag() — guard if rehydrate missed
        const eligible = OffPitchEventsDeck.filter(e => {
            if (!e.trigger) return true;
            try { return !!e.trigger(player); }
            catch { return false; }
        });
        if (eligible.length > 0 && systemRng() < 0.4) {
            setOffPitchEvent(eligible[Math.floor(systemRng() * eligible.length)]);
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

    if (!player || !team) return <div style={{padding:'16px',color:'var(--text-main)'}}>Erro: jogador não encontrado.</div>;

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
        <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '2px', color: 'var(--text-main)' }}>
                <span>{label}</span><span>{value}%</span>
            </label>
            <div style={{ height: '6px', background: 'var(--bg-elevated, var(--ef-color-bg-input))', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border-subtle, var(--ef-color-border-subtle))' }}>
                <div style={{ height: '100%', width: `${value}%`, background: `var(--ef-color-${type === 'boss' ? 'danger' : type === 'fans' ? 'primary' : type === 'teammates' ? 'accent' : 'warning'}, #6ABC3A)`, transition: 'width 200ms ease-out' }} />
            </div>
        </div>
    );

    const starStr = '⭐'.repeat(player.starRating) + '☆'.repeat(5 - player.starRating);
    const pers = PERSONALITIES[player.personality] || PERSONALITIES.maverick;
    const stressColor = player.stress >= 75 ? 'var(--danger)' : player.stress >= 50 ? 'var(--accent)' : 'var(--text-muted)';

    return (
        <div className="ef-anim-fade-in" style={{
            backgroundImage: `url(${bgPlayerDashboard})`,
            imageRendering: 'pixelated',
            WebkitImageRendering: 'pixelated',
            backgroundColor: '#0A130E',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            minHeight: '100dvh',
            padding: '16px',
            color: 'var(--ef-color-neutral-text-hi)'
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {banner && <EfBanner type={banner} onDismiss={() => setBanner(null)} />}
                {/* Off-Pitch Event Modal */}
                {offPitchEvent && (
                    <div className="modal-overlay">
                        <EfPanel variant="elev" padding="md" style={{ maxWidth: '400px' }}>
                            <h3 style={{ margin: '0 0 10px 0' }}>📰 Evento da Semana</h3>
                            <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>{offPitchEvent.text}</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {offPitchEvent.options.map((opt, i) => (
                                    <EfButton key={i} variant="secondary" onClick={() => handleOffPitchChoice(opt)}>{opt.label}</EfButton>
                                ))}
                            </div>
                        </EfPanel>
                    </div>
                )}

                {/* Header Card */}
                <EfPanel variant="elev" padding="md">
                    <div style={{display:'flex',alignItems:'center',gap:'12px', marginBottom: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px'}}>
                        {team?.name && <EfClubBadge name={team.name} size="lg" />}
                        <div style={{flex:1}}>
                            <h2 style={{ margin: 0 }}>{player.name} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{pers.emoji} {pers.name}</span></h2>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{player.position} • {team.name} • Semana {engine.currentWeek}/38</span>
                        </div>
                        <div style={{ color: 'var(--accent)', fontSize: '1.2rem', letterSpacing: '2px' }}>{starStr}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>AÇÕES RESTANTES</div>
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                                {Array.from({ length: player.maxActionSlots }).map((_, i) => (
                                    <div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: i < player.actionSlots ? 'var(--primary)' : 'var(--bg-panel-hover)', border: '1px solid var(--border-subtle)' }} />
                                ))}
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem' }}>
                                <li style={{ marginBottom: '4px' }}><span>⚡ Energia:</span> <strong style={{ color: player.energy < 30 ? 'var(--danger)' : 'var(--primary)' }}>{player.energy}%</strong></li>
                                <li style={{ marginBottom: '4px' }}><span>💰 Dinheiro:</span> <strong>R$ {player.money}</strong></li>
                                <li style={{ marginBottom: '4px' }}><span>🥤 Energéticos:</span> <strong>{player.energyDrinks}</strong></li>
                                <li style={{ marginBottom: '4px' }}><span>⚽ Gols:</span> <strong>{player.seasonGoals}</strong></li>
                                <li><span>🧠 Stress:</span> <strong className={player.stress >= 75 ? 'ef-anim-pulse-glow' : ''} style={{ color: stressColor, padding: player.stress >= 75 ? '2px 6px' : 0, borderRadius: '4px' }}>{player.stress}%</strong></li>
                            </ul>
                        </div>
                        <div>
                            <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>SKILLS</div>
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
                                            background: 'var(--bg-elevated, var(--ef-color-bg-input))',
                                            borderRadius: '3px',
                                            overflow: 'hidden',
                                            border: '1px solid var(--border-subtle, var(--ef-color-border-subtle))'
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${prog}%`,
                                                background: '#6ABC3A',
                                                transition: 'width 200ms ease-out'
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </EfPanel>

                {/* Mental Break Modal */}
                {mentalBreakModal && (
                    <div className="modal-overlay">
                        <EfPanel variant="elev" padding="md" style={{ maxWidth: '400px', textAlign: 'center' }}>
                            <h3 style={{ color: 'var(--danger)', margin: '0 0 10px 0' }}>🧠 CRISE MENTAL — Stress em {player.stress}%</h3>
                            <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>Você não aguenta mais a pressão. Precisa de uma válvula de escape.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <EfButton variant="secondary" onClick={() => handleMentalBreak('party')}>🎉 Sair pra festa (Stress -40, Boss -10)</EfButton>
                                <EfButton variant="secondary" onClick={() => handleMentalBreak('isolation')}>🏠 Isolamento total (Stress -30, Team -8)</EfButton>
                                <EfButton variant="secondary" onClick={() => handleMentalBreak('therapy')}>🧑‍⚕️ Terapia R$2000 (Stress -20)</EfButton>
                            </div>
                        </EfPanel>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '16px' }}>
                    {/* Relationships */}
                    <EfPanel variant="sunk" padding="md" style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', marginTop: 0 }}>RELACIONAMENTOS</h3>
                        <RelBar label="👔 Marcos Oliveira" value={player.relationships.boss} type="boss" />
                        <RelBar label="📣 Tio Dinho" value={player.relationships.fans} type="fans" />
                        <RelBar label="🤝 Rafael Monteiro" value={player.relationships.teammates} type="teammates" />
                        <RelBar label="💼 Patrícia Lemos" value={player.relationships.sponsors} type="sponsors" />
                    </EfPanel>

                    {/* Actions */}
                    <EfPanel variant="elev" padding="md" style={{ flex: 2 }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', marginTop: 0 }}>AÇÕES DA SEMANA</h3>
                        {player.isBenched && <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '8px', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '8px' }}>🔴 Você está no BANCO! Recupere energia ou melhore sua relação com o técnico.</div>}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <EfButton variant="primary" size="sm" onClick={() => handleTrain('technique')} disabled={!player.canAct}>🎯 TREINAR TEC</EfButton>
                            <EfButton variant="primary" size="sm" onClick={() => handleTrain('pace')} disabled={!player.canAct}>💨 TREINAR PAC</EfButton>
                            <EfButton variant="primary" size="sm" onClick={() => handleTrain('power')} disabled={!player.canAct}>💪 TREINAR POW</EfButton>
                            <EfButton variant="primary" size="sm" onClick={() => handleTrain('vision')} disabled={!player.canAct}>👁️ TREINAR VIS</EfButton>
                            <EfButton variant="secondary" size="sm" onClick={handleRest} disabled={!player.canAct}>😴 DESCANSAR</EfButton>
                            <EfButton variant="secondary" size="sm" onClick={handleBuyDrink}>🛒 ENERGÉTICO (R$100)</EfButton>
                            <EfButton variant="secondary" size="sm" onClick={handleUseDrink} disabled={player.energyDrinks <= 0}>🥤 USAR ENERGÉTICO</EfButton>
                        </div>
                        {log && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{log}</p>}
                        {offPitchResult && <p style={{ color: 'var(--accent)', fontSize: '0.8rem', marginTop: '0.5rem' }}>📰 {offPitchResult}</p>}
                    </EfPanel>
                </div>

                {/* Loja de Traits — uso de dinheiro modo carreira */}
                <EfPanel variant="elev" padding="md">
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', marginTop: 0 }}>🛍️ LOJA DE TRAITS ESPECIAIS</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0' }}>
                        Habilidades únicas. Custam dinheiro + aprovação do técnico. Saldo atual: <strong style={{ color: 'var(--primary)' }}>R$ {player.money}</strong>
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                        {Object.entries(TRAITS_CATALOG).map(([id, t]) => {
                            const owned = player.traits?.includes(id);
                            const canAfford = player.money >= t.cost;
                            const bossOk = player.relationships.boss >= t.requiredBoss;
                            const disabled = owned || !canAfford || !bossOk;
                            return (
                                <div key={id} style={{
                                    border: '1px solid var(--border-subtle, var(--ef-color-border-subtle))',
                                    borderRadius: '4px',
                                    padding: '0.5rem',
                                    background: owned ? 'rgba(106,188,58,0.1)' : 'var(--bg-panel-hover)',
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
                                    <EfButton
                                        size="sm"
                                        variant={owned ? 'secondary' : 'primary'}
                                        onClick={() => handleBuyTrait(id)}
                                        disabled={disabled}
                                        style={{ width: '100%', justifyContent: 'center' }}
                                    >
                                        {owned ? 'ADQUIRIDO' : !canAfford ? 'SEM DINHEIRO' : !bossOk ? 'TÉCNICO BAIXO' : 'COMPRAR'}
                                    </EfButton>
                                </div>
                            );
                        })}
                    </div>
                </EfPanel>

                {/* SPEC-062 Sub-Attributes Panel (16 granular) */}
                <EfPanel variant="elev" padding="md">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem' }}>🎯 SUB-ATRIBUTOS</h3>
                        <EfButton
                            size="sm"
                            variant="secondary"
                            onClick={() => setShowSubAttrs(!showSubAttrs)}
                        >
                            {showSubAttrs ? 'OCULTAR' : 'MOSTRAR'}
                        </EfButton>
                    </div>
                    {showSubAttrs && player.subAttrs && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', marginTop: '12px' }}>
                            {Object.entries(SUB_ATTRIBUTES).map(([base, subs]) => (
                                <div key={base} style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '8px', background: 'var(--bg-panel-hover)' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '8px', textTransform: 'uppercase' }}>{base}</div>
                                    {subs.map(sub => {
                                        const lvl = player.subAttrs[sub] ?? 0;
                                        const prog = player.subAttrProgress?.[sub] ?? 0;
                                        return (
                                            <div key={sub} style={{ marginBottom: '6px' }}>
                                                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.7rem', marginBottom: '4px' }}>
                                                    <span>{sub} <strong>{lvl}</strong></span>
                                                    <EfButton
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => handleTrainSubAttr(sub)}
                                                        disabled={!player.canAct}
                                                        style={{ padding: '0 4px', height: 'auto', fontSize: '0.6rem' }}
                                                    >TREINAR</EfButton>
                                                </div>
                                                <div style={{ height:'4px', background:'var(--bg-elevated)', borderRadius:'2px', overflow:'hidden', border: '1px solid var(--border-subtle)' }}>
                                                    <div style={{ height:'100%', width:`${prog}%`, background:'#6ABC3A' }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </EfPanel>

                {/* SPEC-065 Loja Lifestyle — casa, carro, festas, caridade, investimentos, casamento */}
                <EfPanel variant="elev" padding="md">
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', marginTop: 0 }}>🏛️ LIFESTYLE</h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0' }}>
                        🏠 {player.lifestyle?.ownedHouse ? LIFESTYLE_CATALOG[player.lifestyle.ownedHouse]?.name : 'Sem casa'} • 
                        🚗 {player.lifestyle?.ownedCar ? LIFESTYLE_CATALOG[player.lifestyle.ownedCar]?.name : 'Sem carro'} • 
                        💑 {player.lifestyle?.isMarried ? 'Casado' : 'Solteiro'} • 
                        😊 Mood {player.lifestyle?.mood ?? 50}%
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '8px' }}>
                        {Object.entries(LIFESTYLE_CATALOG).map(([id, it]) => {
                            const owned = (it.type === 'house' && player.lifestyle?.ownedHouse === id) ||
                                          (it.type === 'car' && player.lifestyle?.ownedCar === id) ||
                                          (it.type === 'event' && id === 'wedding' && player.lifestyle?.isMarried);
                            const canAfford = player.money >= it.cost;
                            const disabled = owned || !canAfford;
                            return (
                                <div key={id} style={{
                                    border: '1px solid var(--border-subtle, var(--ef-color-border-subtle))',
                                    borderRadius: '4px',
                                    padding: '8px',
                                    opacity: disabled && !owned ? 0.65 : 1,
                                    background: owned ? 'rgba(106,188,58,0.1)' : 'var(--bg-panel-hover)'
                                }}>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '2px' }}>
                                        {it.emoji} {owned ? '✅ ' : ''}{it.name}
                                    </div>
                                    <div style={{ fontSize: '0.68rem', color: canAfford ? 'var(--primary)' : 'var(--danger)', margin: '4px 0 8px 0' }}>
                                        R$ {it.cost.toLocaleString('pt-BR')}
                                    </div>
                                    <EfButton
                                        size="sm"
                                        variant={owned ? 'secondary' : 'primary'}
                                        onClick={() => handleBuyLifestyle(id)}
                                        disabled={disabled}
                                        style={{ width: '100%', justifyContent: 'center' }}
                                    >
                                        {owned ? 'TEM' : !canAfford ? 'POBRE' : it.oneShot ? 'FAZER' : 'COMPRAR'}
                                    </EfButton>
                                </div>
                            );
                        })}
                    </div>
                </EfPanel>

                <EfButton variant="primary" onClick={handleAdvance} style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '1.1rem' }}>
                    ⚽ AVANÇAR PARA A PARTIDA (SEMANA {engine.currentWeek + 1})
                </EfButton>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <EfButton variant="secondary" size="sm" onClick={() => changeView('standings')}>📊 TABELA</EfButton>
                    <EfButton variant="secondary" size="sm" onClick={() => changeView('achievements')}>🏆 CONQUISTAS</EfButton>
                </div>
            </div>
        </div>
    );
}

export default PlayerDashboardView;
