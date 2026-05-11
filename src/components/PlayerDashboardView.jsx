/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { OffPitchEventsDeck } from '../engine/OffPitchEventsDeck';
import { PERSONALITIES, TRAITS_CATALOG, LIFESTYLE_CATALOG, SUB_ATTRIBUTES } from '../engine/PlayerCareer';
import { EfClubBadge, EfBanner } from './ui';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';
import { EfModal } from './ui/EfModal';

import { 
    User, Heartbeat, SoccerBall, Lightning, Brain, ShoppingCart, Target, 
    TrendUp, HandsClapping, House, Car, Heart, Coins, Storefront, Backpack,
    WarningCircle, Smiley, Handshake, ChartBar, Star
} from '@phosphor-icons/react';

import { rng as systemRng } from '../engine/rng.js';

import '../styles/gdd-systems.css';

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
    const [tab, setTab] = useState('overview');

    const prevTeamIdRef = React.useRef(player?.teamId ?? null);
    const prevRetiredRef = React.useRef(player?._retired ?? false);
    const prevMotmRef = React.useRef(player?.career?.seasonMotm ?? 0);

    React.useEffect(() => {
        if (!player) return;
        const eligible = OffPitchEventsDeck.filter(e => {
            if (!e.trigger) return true;
            try { return !!e.trigger(player); }
            catch { return false; }
        });
        if (eligible.length > 0 && systemRng() < 0.4) {
            setOffPitchEvent(eligible[Math.floor(systemRng() * eligible.length)]);
        }
    }, [engine.currentWeek, player]);

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

    if (!player || !team) return <div style={{padding:'24px',color:'#FDFBF7', fontFamily: 'var(--font-mono)'}}>Erro: jogador não encontrado.</div>;

    const handleTrain = (skill) => { const result = player.train(skill); setLog(result.msg); forceUpdate(); };
    const handleRest = () => { const result = player.rest(); setLog(result.msg); forceUpdate(); };
    const handleBuyDrink = () => { const result = player.buyEnergyDrink(); setLog(result.msg); forceUpdate(); };
    const handleUseDrink = () => { const result = player.consumeEnergyDrink(); setLog(result.msg); forceUpdate(); };
    const handleTrainSubAttr = (subAttr) => { if (!player.trainSubAttr) return; const result = player.trainSubAttr(subAttr); setLog(result.msg); forceUpdate(); };
    const handleBuyTrait = (traitId) => { const result = player.buyTrait(traitId); setLog(result.msg); forceUpdate(); };
    const handleBuyLifestyle = (itemId) => { const result = player.buyLifestyle(itemId); setLog(result.msg); forceUpdate(); };
    const handleAdvance = () => changeView('player_match');

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
        
        if (option.flags?.set) player.setFlag(option.flags.set);
        if (option.flags?.clear) player.clearFlag(option.flags.clear);
        
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

    const RelBar = ({ label, value, type, icon }) => (
        <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', color: '#8E9E94', fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{icon} {label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#FDFBF7' }}>{value}%</span>
            </label>
            <div style={{ height: '6px', background: '#1A1F24', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${value}%`, background: type === 'boss' ? '#FF3333' : type === 'fans' ? '#39FF14' : type === 'teammates' ? '#FFD700' : '#40BAF7', transition: 'width 200ms ease-out' }} />
            </div>
        </div>
    );

    const starStr = Array(player.starRating).fill(<Star weight="fill" color="#FFD700" size={16} />).concat(Array(5 - player.starRating).fill(<Star color="#4A5059" size={16} />));
    const pers = PERSONALITIES[player.personality] || PERSONALITIES.maverick;
    const stressColor = player.stress >= 75 ? '#FF3333' : player.stress >= 50 ? '#FFD700' : '#8E9E94';

    return (
        <div style={{ padding: '24px', width: '100%', height: '100%', overflowY: 'auto', backgroundColor: 'var(--bg-dark, #0D1117)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {banner && <EfBanner type={banner} onDismiss={() => setBanner(null)} />}
                
                {/* === HEADER — LUXURY BENTO === */}
                <EfPanel variant="hero" padding="lg" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        {team?.name && <EfClubBadge name={team.name} size="lg" />}
                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#1A1F24', color: '#8E9E94', padding: '4px 12px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', marginBottom: '12px' }}>
                                <span>{pers.emoji}</span> {pers.name.toUpperCase()} • SÉRIE {['A','B','C','D'][team.division - 1]}
                            </div>
                            <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '2rem', fontWeight: '800', margin: '0 0 8px 0', color: '#FDFBF7' }}>
                                {player.name}
                            </h2>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                {starStr.map((s, i) => <React.Fragment key={i}>{s}</React.Fragment>)}
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#8E9E94', marginLeft: '12px' }}>
                                    {player.position} • {team.name}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 'bold', color: '#39FF14' }}>
                            R$ {(player.money).toLocaleString('pt-BR')}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#FFD700', background: '#2D2916', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <SoccerBall weight="fill" /> {player.seasonGoals} GOLS NA TEMPORADA
                        </div>
                        <div style={{ marginTop: '12px', width: '200px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#8E9E94', marginBottom: '6px' }}>
                                <span>SEM {engine.currentWeek}/38</span>
                                <span>AÇÕES</span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                {Array.from({ length: player.maxActionSlots }).map((_, i) => (
                                    <div key={i} style={{ width: '24px', height: '6px', background: i < player.actionSlots ? '#39FF14' : '#1A1F24' }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </EfPanel>

                {/* === ALERTS === */}
                {(player.isBenched || player.stress >= 75 || player.energy < 30) && (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {player.isBenched && <EfPanel padding="sm" style={{ display: 'inline-flex', alignItems: 'center', background: '#2D1616', borderColor: '#FF3333', gap: '8px' }}><WarningCircle color="#FF3333" weight="fill" /><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#FF3333', fontWeight: 'bold' }}>VOCÊ ESTÁ NO BANCO!</span></EfPanel>}
                        {player.stress >= 75 && <EfPanel padding="sm" style={{ display: 'inline-flex', alignItems: 'center', background: '#2D1616', borderColor: '#FF3333', gap: '8px' }}><Brain color="#FF3333" weight="fill" /><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#FF3333', fontWeight: 'bold' }}>STRESS CRÍTICO ({player.stress}%)</span></EfPanel>}
                        {player.energy < 30 && <EfPanel padding="sm" style={{ display: 'inline-flex', alignItems: 'center', background: '#2D1616', borderColor: '#FF3333', gap: '8px' }}><Lightning color="#FF3333" weight="fill" /><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#FF3333', fontWeight: 'bold' }}>EXAUSTÃO ({player.energy}%)</span></EfPanel>}
                    </div>
                )}

                {/* === BENTO GRID LAYOUT === */}
                <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>
                    {/* LEFT COLUMN: Navigation & Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <EfPanel padding="md" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[{id:'overview',label:'Visão Geral'},{id:'skills',label:'Treinamento'},{id:'store',label:'Loja de Traits'},{id:'lifestyle',label:'Lifestyle'}].map(t => (
                                <EfButton key={t.id} variant={tab === t.id ? 'primary' : 'secondary'} size="md" onClick={() => setTab(t.id)} style={{ width: '100%', justifyContent: 'flex-start', fontFamily: 'var(--font-sans)', fontWeight: '600' }}>
                                    {t.label}
                                </EfButton>
                            ))}
                        </EfPanel>

                        <div style={{ marginTop: 'auto' }}>
                            <EfButton variant="primary" size="lg" style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '24px', fontFamily: 'var(--font-sans)', fontWeight: 'bold', gap: '8px' }} onClick={handleAdvance}>
                                <SoccerBall weight="fill" /> AVANÇAR SEMANA
                            </EfButton>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Content Area */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* GLOBAL STATUS BAR */}
                        <EfPanel padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#161B22' }}>
                            <div style={{ display: 'flex', gap: '32px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 'bold', color: player.energy < 30 ? '#FF3333' : '#39FF14', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}><Lightning weight="fill" /> {player.energy}%</span>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#8E9E94' }}>ENERGIA</span>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 'bold', color: stressColor, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}><Brain weight="fill" /> {player.stress}%</span>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#8E9E94' }}>STRESS</span>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 'bold', color: '#40BAF7', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}><Storefront weight="fill" /> {player.energyDrinks}</span>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#8E9E94' }}>ENERGÉTICOS</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <EfButton variant="secondary" size="sm" onClick={handleRest} disabled={!player.canAct}><Lightning /> DESCANSAR</EfButton>
                                <EfButton variant="secondary" size="sm" onClick={handleBuyDrink}><ShoppingCart /> COMPRAR (R$100)</EfButton>
                                <EfButton variant="secondary" size="sm" onClick={handleUseDrink} disabled={player.energyDrinks <= 0}><Storefront /> USAR BEBIDA</EfButton>
                            </div>
                        </EfPanel>

                        {/* TAB CONTENTS */}
                        {tab === 'overview' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <EfPanel padding="md">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '16px', color: '#8E9E94' }}><Handshake weight="fill" /> RELACIONAMENTOS</div>
                                        <RelBar label="Treinador" value={player.relationships.boss} type="boss" icon={<User weight="fill" />} />
                                        <RelBar label="Torcida" value={player.relationships.fans} type="fans" icon={<HandsClapping weight="fill" />} />
                                        <RelBar label="Companheiros" value={player.relationships.teammates} type="teammates" icon={<User weight="fill" />} />
                                        <RelBar label="Patrocinadores" value={player.relationships.sponsors} type="sponsors" icon={<Coins weight="fill" />} />
                                    </EfPanel>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <EfPanel padding="md">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '16px', color: '#8E9E94' }}><Target weight="fill" /> ATRIBUTOS PRINCIPAIS</div>
                                        {[
                                            { key: 'technique', label: 'Técnica', color: '#40BAF7' },
                                            { key: 'pace',      label: 'Velocidade', color: '#39FF14' },
                                            { key: 'power',     label: 'Força', color: '#FF3333' },
                                            { key: 'vision',    label: 'Visão', color: '#FFD700' }
                                        ].map(s => {
                                            const lvl = player.skills[s.key] ?? 0;
                                            const prog = player.skillProgress?.[s.key] ?? 0;
                                            return (
                                                <div key={s.key} style={{ marginBottom: '12px' }}>
                                                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem', fontFamily: 'var(--font-sans)', fontWeight: 'bold', color: '#FDFBF7', marginBottom: '6px' }}>
                                                        <span>{s.label}</span>
                                                        <span style={{ fontFamily: 'var(--font-mono)' }}>{lvl} <span style={{ color: '#8E9E94', fontSize: '0.75rem' }}>({prog}/100 XP)</span></span>
                                                    </div>
                                                    <div style={{ height: '6px', background: '#1A1F24', overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${prog}%`, background: s.color, transition: 'width 200ms ease-out' }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </EfPanel>

                                    {offPitchResult && (
                                        <EfPanel padding="md" style={{ borderColor: '#FFD700', background: '#2D2916' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px', color: '#FFD700' }}><WarningCircle weight="fill" /> ÚLTIMO EVENTO</div>
                                            <p style={{ color: '#FDFBF7', fontSize: '0.85rem', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>{offPitchResult}</p>
                                        </EfPanel>
                                    )}
                                </div>
                            </div>
                        )}

                        {tab === 'skills' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <EfPanel padding="md">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '16px', color: '#8E9E94' }}><TrendUp weight="fill" /> TREINAMENTO PRINCIPAL</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                        <EfButton variant="primary" size="lg" onClick={() => handleTrain('technique')} disabled={!player.canAct} style={{ flexDirection: 'column', padding: '16px', gap: '8px' }}>
                                            <Target size={24} /> <span>TÉCNICA</span>
                                        </EfButton>
                                        <EfButton variant="primary" size="lg" onClick={() => handleTrain('pace')} disabled={!player.canAct} style={{ flexDirection: 'column', padding: '16px', gap: '8px' }}>
                                            <Lightning size={24} /> <span>VELOCIDADE</span>
                                        </EfButton>
                                        <EfButton variant="primary" size="lg" onClick={() => handleTrain('power')} disabled={!player.canAct} style={{ flexDirection: 'column', padding: '16px', gap: '8px' }}>
                                            <Heartbeat size={24} /> <span>FORÇA</span>
                                        </EfButton>
                                        <EfButton variant="primary" size="lg" onClick={() => handleTrain('vision')} disabled={!player.canAct} style={{ flexDirection: 'column', padding: '16px', gap: '8px' }}>
                                            <Brain size={24} /> <span>VISÃO</span>
                                        </EfButton>
                                    </div>
                                </EfPanel>

                                <EfPanel padding="md">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '0.9rem', color: '#8E9E94' }}><ChartBar weight="fill" /> SUB-ATRIBUTOS ESPECÍFICOS</div>
                                        <EfButton size="sm" variant="secondary" onClick={() => setShowSubAttrs(!showSubAttrs)}>{showSubAttrs ? 'OCULTAR' : 'MOSTRAR'}</EfButton>
                                    </div>
                                    {showSubAttrs && player.subAttrs && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                            {Object.entries(SUB_ATTRIBUTES).map(([base, subs]) => (
                                                <div key={base} style={{ background: '#1A1F24', padding: '12px' }}>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#FFD700', marginBottom: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>{base}</div>
                                                    {subs.map(sub => {
                                                        const lvl = player.subAttrs[sub] ?? 0;
                                                        const prog = player.subAttrProgress?.[sub] ?? 0;
                                                        return (
                                                            <div key={sub} style={{ marginBottom: '12px' }}>
                                                                <div style={{ display:'flex', justifyContent:'space-between', alignItems: 'center', fontSize:'0.75rem', marginBottom: '6px', fontFamily: 'var(--font-sans)', color: '#FDFBF7' }}>
                                                                    <span>{sub} <strong style={{ fontFamily: 'var(--font-mono)', color: '#40BAF7' }}>{lvl}</strong></span>
                                                                    <EfButton size="sm" variant="secondary" onClick={() => handleTrainSubAttr(sub)} disabled={!player.canAct} style={{ padding: '4px 8px', fontSize: '0.65rem' }}>TREINAR</EfButton>
                                                                </div>
                                                                <div style={{ height:'4px', background:'#0D1117', overflow:'hidden' }}>
                                                                    <div style={{ height:'100%', width:`${prog}%`, background:'#39FF14' }} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </EfPanel>
                            </div>
                        )}

                        {tab === 'store' && (
                            <EfPanel padding="md">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '24px', color: '#8E9E94' }}><Storefront weight="fill" /> TRAITS ESPECIAIS</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                                    {Object.entries(TRAITS_CATALOG).map(([id, t]) => {
                                        const owned = player.traits?.includes(id);
                                        const canAfford = player.money >= t.cost;
                                        const bossOk = player.relationships.boss >= t.requiredBoss;
                                        const disabled = owned || !canAfford || !bossOk;
                                        return (
                                            <div key={id} style={{ background: owned ? '#162D1C' : '#1A1F24', border: `1px solid ${owned ? '#39FF14' : '#2D3748'}`, padding: '16px', display: 'flex', flexDirection: 'column', opacity: disabled && !owned ? 0.5 : 1 }}>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#FDFBF7', fontFamily: 'var(--font-sans)', marginBottom: '8px' }}>{owned ? '✓ ' : ''}{t.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#8E9E94', fontFamily: 'var(--font-sans)', marginBottom: '16px', flex: 1, lineHeight: 1.4 }}>{t.description}</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                                                    <span style={{ color: canAfford ? '#39FF14' : '#FF3333' }}>R$ {t.cost.toLocaleString('pt-BR')}</span>
                                                    <span style={{ color: bossOk ? '#40BAF7' : '#FF3333', display: 'flex', alignItems: 'center', gap: '4px' }}><User /> {t.requiredBoss}%</span>
                                                </div>
                                                <EfButton size="sm" variant={owned ? 'secondary' : 'primary'} onClick={() => handleBuyTrait(id)} disabled={disabled} style={{ width: '100%', justifyContent: 'center', fontWeight: 'bold' }}>
                                                    {owned ? 'ADQUIRIDO' : !canAfford ? 'SEM DINHEIRO' : !bossOk ? 'CONFIANÇA BAIXA' : 'COMPRAR'}
                                                </EfButton>
                                            </div>
                                        );
                                    })}
                                </div>
                            </EfPanel>
                        )}

                        {tab === 'lifestyle' && (
                            <EfPanel padding="md">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '16px', color: '#8E9E94' }}><House weight="fill" /> LIFESTYLE & BENS</div>
                                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: '#FDFBF7', background: '#1A1F24', padding: '12px', }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><House color="#40BAF7" weight="fill" /> {player.lifestyle?.ownedHouse ? LIFESTYLE_CATALOG[player.lifestyle.ownedHouse]?.name : 'Sem casa'}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Car color="#FFD700" weight="fill" /> {player.lifestyle?.ownedCar ? LIFESTYLE_CATALOG[player.lifestyle.ownedCar]?.name : 'Sem carro'}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Heart color="#FF3333" weight="fill" /> {player.lifestyle?.isMarried ? 'Casado' : 'Solteiro'}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Smiley color="#39FF14" weight="fill" /> Mood {player.lifestyle?.mood ?? 50}%</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                                    {Object.entries(LIFESTYLE_CATALOG).map(([id, it]) => {
                                        const owned = (it.type === 'house' && player.lifestyle?.ownedHouse === id) ||
                                                      (it.type === 'car' && player.lifestyle?.ownedCar === id) ||
                                                      (it.type === 'event' && id === 'wedding' && player.lifestyle?.isMarried);
                                        const canAfford = player.money >= it.cost;
                                        const disabled = owned || !canAfford;
                                        return (
                                            <div key={id} style={{ background: owned ? '#162D1C' : '#1A1F24', border: `1px solid ${owned ? '#39FF14' : '#2D3748'}`, padding: '16px', opacity: disabled && !owned ? 0.5 : 1 }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#FDFBF7', fontFamily: 'var(--font-sans)', marginBottom: '8px' }}>{it.emoji} {owned ? '✓ ' : ''}{it.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: canAfford ? '#39FF14' : '#FF3333', fontFamily: 'var(--font-mono)', marginBottom: '16px' }}>R$ {it.cost.toLocaleString('pt-BR')}</div>
                                                <EfButton size="sm" variant={owned ? 'secondary' : 'primary'} onClick={() => handleBuyLifestyle(id)} disabled={disabled} style={{ width: '100%', justifyContent: 'center', fontWeight: 'bold' }}>
                                                    {owned ? 'ADQUIRIDO' : !canAfford ? 'SEM DINHEIRO' : it.oneShot ? 'FAZER' : 'COMPRAR'}
                                                </EfButton>
                                            </div>
                                        );
                                    })}
                                </div>
                            </EfPanel>
                        )}
                    </div>
                </div>

                {/* BOTTOM NAVIGATION */}
                <div style={{ display: 'flex', gap: '16px', marginTop: 'auto', paddingTop: '24px' }}>
                    {[{view:'standings',icon:<ChartBar weight="fill"/>,label:'Tabela'},{view:'achievements',icon:<Target weight="fill"/>,label:'Conquistas'}].map(n => (
                        <EfButton key={n.view} variant="secondary" size="lg" className="ef-flex-1" style={{ justifyContent: 'center', padding: '24px', fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '1rem', gap: '8px' }} onClick={() => changeView(n.view)}>
                            {n.icon} {n.label}
                        </EfButton>
                    ))}
                </div>

                {/* Event Modals and Toasts */}
                {log && <div className="event-toast success" onClick={() => setLog('')}>{log}</div>}

                {offPitchEvent && (
                    <EfModal title="📰 Evento da Semana" onClose={() => setOffPitchEvent(null)}>
                        <p style={{ marginBottom: '24px', fontSize: '1rem', lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>{offPitchEvent.text}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {offPitchEvent.options.map((opt, i) => (
                                <EfButton key={i} variant="secondary" onClick={() => handleOffPitchChoice(opt)} style={{ justifyContent: 'flex-start', padding: '16px', fontFamily: 'var(--font-sans)' }}>{opt.label}</EfButton>
                            ))}
                        </div>
                    </EfModal>
                )}

                {mentalBreakModal && (
                    <EfModal title="🧠 CRISE MENTAL" onClose={() => {}}>
                        <p style={{ color: '#FF3333', fontWeight: 'bold', marginBottom: '8px', fontFamily: 'var(--font-sans)' }}>Stress em {player.stress}%</p>
                        <p style={{ marginBottom: '24px', fontSize: '0.9rem', lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>Você não aguenta mais a pressão. Precisa de uma válvula de escape.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <EfButton variant="secondary" onClick={() => handleMentalBreak('party')} style={{ justifyContent: 'flex-start' }}>🎉 Sair pra festa (Stress -40, Treinador -10)</EfButton>
                            <EfButton variant="secondary" onClick={() => handleMentalBreak('isolation')} style={{ justifyContent: 'flex-start' }}>🏠 Isolamento total (Stress -30, Time -8)</EfButton>
                            <EfButton variant="secondary" onClick={() => handleMentalBreak('therapy')} style={{ justifyContent: 'flex-start' }}>🧑‍⚕️ Terapia R$2000 (Stress -20)</EfButton>
                        </div>
                    </EfModal>
                )}

            </div>
        </div>
    );
}

export default PlayerDashboardView;
