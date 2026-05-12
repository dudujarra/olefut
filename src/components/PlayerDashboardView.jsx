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
    WarningCircle, Smiley, Handshake, ChartBar, Star, CheckCircle
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

    // BUG-081 (SPEC-158): aceitável — spawn aleatório de evento off-pitch por semana.
    // systemRng() impuro; useMemo não aplicável.
    /* eslint-disable react-hooks/set-state-in-effect */
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
    /* eslint-enable react-hooks/set-state-in-effect */

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

    if (!player || !team) return <div className="ef-mono ef-text-main" style={{padding:'24px'}}>Erro: jogador não encontrado.</div>;

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

    const RelBar = ({ label, value, type, icon }) => {
        const fillMod = type === 'boss'
            ? 'ef-bar__fill--danger'
            : type === 'fans'
                ? ''
                : type === 'teammates'
                    ? 'ef-bar__fill--accent'
                    : 'ef-bar__fill--info';
        return (
            <div style={{ marginBottom: '12px' }}>
                <label className="ef-sans ef-text-muted" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 'bold' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{icon} {label}</span>
                    <span className="ef-mono ef-text-main">{value}%</span>
                </label>
                <div className="ef-bar">
                    <div className={`ef-bar__fill ${fillMod}`} style={{ width: `${value}%` }} />
                </div>
            </div>
        );
    };

    const starStr = Array(player.starRating).fill(<Star weight="fill" color="#FFD700" size={16} />).concat(Array(5 - player.starRating).fill(<Star color="#4A5059" size={16} />));
    const pers = PERSONALITIES[player.personality] || PERSONALITIES.maverick;
    const stressColor = player.stress >= 75 ? '#FF3333' : player.stress >= 50 ? '#FFD700' : '#8E9E94';

    return (
        <div className="ef-view-shell ef-view-shell--fixed">
            <div className="ef-view-container ef-view-container--wide">
                {banner && <EfBanner type={banner} onDismiss={() => setBanner(null)} />}

                {/* === HEADER — LUXURY BENTO === */}
                <EfPanel variant="hero" padding="lg" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        {team?.name && <EfClubBadge name={team.name} size="lg" />}
                        <div>
                            <div className="ef-tag-mono" style={{ marginBottom: '12px' }}>
                                <span aria-hidden>{pers.emoji}</span> {pers.name.toUpperCase()} • SÉRIE {['A','B','C','D'][team.division - 1]}
                            </div>
                            <h2 className="ef-heading-xl">
                                {player.name}
                            </h2>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                {starStr.map((s, i) => <React.Fragment key={i}>{s}</React.Fragment>)}
                                <span className="ef-mono ef-text-muted" style={{ fontSize: '0.85rem', marginLeft: '12px' }}>
                                    {player.position} • {team.name}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <div className="ef-mono ef-text-primary" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            R$ {(player.money).toLocaleString('pt-BR')}
                        </div>
                        <div className="ef-tag-mono ef-tag-mono--accent">
                            <SoccerBall weight="fill" /> {player.seasonGoals} GOLS NA TEMPORADA
                        </div>
                        <div style={{ marginTop: '12px', width: '200px' }}>
                            <div className="ef-mono ef-text-muted" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '6px' }}>
                                <span>SEM {engine.currentWeek}/38</span>
                                <span>AÇÕES</span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                {Array.from({ length: player.maxActionSlots }).map((_, i) => (
                                    <div key={i} className={`ef-action-slot${i < player.actionSlots ? ' ef-action-slot--filled' : ''}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                </EfPanel>

                {/* === ALERTS === */}
                {(player.isBenched || player.stress >= 75 || player.energy < 30) && (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {player.isBenched && <EfPanel padding="sm" style={{ display: 'inline-flex', alignItems: 'center', background: '#2D1616', borderColor: '#FF3333', gap: '8px' }}><WarningCircle color="#FF3333" weight="fill" /><span className="ef-mono ef-text-danger" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>VOCÊ ESTÁ NO BANCO!</span></EfPanel>}
                        {player.stress >= 75 && <EfPanel padding="sm" style={{ display: 'inline-flex', alignItems: 'center', background: '#2D1616', borderColor: '#FF3333', gap: '8px' }}><Brain color="#FF3333" weight="fill" /><span className="ef-mono ef-text-danger" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>STRESS CRÍTICO ({player.stress}%)</span></EfPanel>}
                        {player.energy < 30 && <EfPanel padding="sm" style={{ display: 'inline-flex', alignItems: 'center', background: '#2D1616', borderColor: '#FF3333', gap: '8px' }}><Lightning color="#FF3333" weight="fill" /><span className="ef-mono ef-text-danger" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>EXAUSTÃO ({player.energy}%)</span></EfPanel>}
                    </div>
                )}

                {/* === BENTO GRID LAYOUT === */}
                <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>
                    {/* LEFT COLUMN: Navigation & Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <EfPanel padding="md" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[{id:'overview',label:'Visão Geral'},{id:'skills',label:'Treinamento'},{id:'store',label:'Loja de Traits'},{id:'lifestyle',label:'Lifestyle'}].map(t => (
                                <EfButton key={t.id} variant={tab === t.id ? 'primary' : 'secondary'} size="md" onClick={() => setTab(t.id)} className="ef-sans" style={{ width: '100%', justifyContent: 'flex-start', fontWeight: '600' }}>
                                    {t.label}
                                </EfButton>
                            ))}
                        </EfPanel>

                        <div style={{ marginTop: 'auto' }}>
                            <EfButton variant="primary" size="lg" className="ef-sans" style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '24px', fontWeight: 'bold', gap: '8px' }} onClick={handleAdvance}>
                                <SoccerBall weight="fill" /> AVANÇAR SEMANA
                            </EfButton>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Content Area */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* GLOBAL STATUS BAR */}
                        <EfPanel padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#161B22' }}>
                            <div style={{ display: 'flex', gap: '32px' }}>
                                <div className="ef-overview-cell">
                                    <span className="ef-overview-cell__value" style={{ color: player.energy < 30 ? '#FF3333' : '#39FF14' }}><Lightning weight="fill" /> {player.energy}%</span>
                                    <span className="ef-overview-cell__label">ENERGIA</span>
                                </div>
                                <div className="ef-overview-cell">
                                    <span className="ef-overview-cell__value" style={{ color: stressColor }}><Brain weight="fill" /> {player.stress}%</span>
                                    <span className="ef-overview-cell__label">STRESS</span>
                                </div>
                                <div className="ef-overview-cell">
                                    <span className="ef-overview-cell__value ef-text-info"><Storefront weight="fill" /> {player.energyDrinks}</span>
                                    <span className="ef-overview-cell__label">ENERGÉTICOS</span>
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
                                        <div className="ef-sans ef-text-muted" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '16px' }}><Handshake weight="fill" /> RELACIONAMENTOS</div>
                                        <RelBar label="Treinador" value={player.relationships.boss} type="boss" icon={<User weight="fill" />} />
                                        <RelBar label="Torcida" value={player.relationships.fans} type="fans" icon={<HandsClapping weight="fill" />} />
                                        <RelBar label="Companheiros" value={player.relationships.teammates} type="teammates" icon={<User weight="fill" />} />
                                        <RelBar label="Patrocinadores" value={player.relationships.sponsors} type="sponsors" icon={<Coins weight="fill" />} />
                                    </EfPanel>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <EfPanel padding="md">
                                        <div className="ef-sans ef-text-muted" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '16px' }}><Target weight="fill" /> ATRIBUTOS PRINCIPAIS</div>
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
                                                    <div className="ef-sans ef-text-main" style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>
                                                        <span>{s.label}</span>
                                                        <span className="ef-mono">{lvl} <span className="ef-text-muted" style={{ fontSize: '0.75rem' }}>({prog}/100 XP)</span></span>
                                                    </div>
                                                    <div className="ef-bar">
                                                        <div className="ef-bar__fill" style={{ width: `${prog}%`, background: s.color }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </EfPanel>

                                    {offPitchResult && (
                                        <EfPanel padding="md" style={{ borderColor: '#FFD700', background: '#2D2916' }}>
                                            <div className="ef-sans ef-text-accent" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px' }}><WarningCircle weight="fill" /> ÚLTIMO EVENTO</div>
                                            <p className="ef-sans ef-text-main" style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>{offPitchResult}</p>
                                        </EfPanel>
                                    )}
                                </div>
                            </div>
                        )}

                        {tab === 'skills' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <EfPanel padding="md">
                                    <div className="ef-sans ef-text-muted" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '16px' }}><TrendUp weight="fill" /> TREINAMENTO PRINCIPAL</div>
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
                                        <div className="ef-sans ef-text-muted" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}><ChartBar weight="fill" /> SUB-ATRIBUTOS ESPECÍFICOS</div>
                                        <EfButton size="sm" variant="secondary" onClick={() => setShowSubAttrs(!showSubAttrs)}>{showSubAttrs ? 'OCULTAR' : 'MOSTRAR'}</EfButton>
                                    </div>
                                    {showSubAttrs && player.subAttrs && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                            {Object.entries(SUB_ATTRIBUTES).map(([base, subs]) => (
                                                <div key={base} style={{ background: '#1A1F24', padding: '12px' }}>
                                                    <div className="ef-sans ef-text-accent" style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase' }}>{base}</div>
                                                    {subs.map(sub => {
                                                        const lvl = player.subAttrs[sub] ?? 0;
                                                        const prog = player.subAttrProgress?.[sub] ?? 0;
                                                        return (
                                                            <div key={sub} style={{ marginBottom: '12px' }}>
                                                                <div className="ef-sans ef-text-main" style={{ display:'flex', justifyContent:'space-between', alignItems: 'center', fontSize:'0.75rem', marginBottom: '6px' }}>
                                                                    <span>{sub} <strong className="ef-mono ef-text-info">{lvl}</strong></span>
                                                                    <EfButton size="sm" variant="secondary" onClick={() => handleTrainSubAttr(sub)} disabled={!player.canAct} style={{ padding: '4px 8px', fontSize: '0.65rem' }}>TREINAR</EfButton>
                                                                </div>
                                                                <div className="ef-bar ef-bar--xs">
                                                                    <div className="ef-bar__fill" style={{ width: `${prog}%` }} />
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
                                <div className="ef-sans ef-text-muted" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '24px' }}><Storefront weight="fill" /> TRAITS ESPECIAIS</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                                    {Object.entries(TRAITS_CATALOG).map(([id, t]) => {
                                        const owned = player.traits?.includes(id);
                                        const canAfford = player.money >= t.cost;
                                        const bossOk = player.relationships.boss >= t.requiredBoss;
                                        const disabled = owned || !canAfford || !bossOk;
                                        const cardClass = `ef-shop-card${owned ? ' ef-shop-card--owned' : ''}${disabled && !owned ? ' ef-shop-card--disabled' : ''}`;
                                        return (
                                            <div key={id} className={cardClass}>
                                                <div className="ef-sans ef-text-main" style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {owned && <CheckCircle weight="fill" size={14} className="ef-text-primary" />}
                                                    {t.name}
                                                </div>
                                                <div className="ef-sans ef-text-muted" style={{ fontSize: '0.75rem', marginBottom: '16px', flex: 1, lineHeight: 1.4 }}>{t.description}</div>
                                                <div className="ef-mono" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '0.8rem' }}>
                                                    <span className={canAfford ? 'ef-text-primary' : 'ef-text-danger'}>R$ {t.cost.toLocaleString('pt-BR')}</span>
                                                    <span className={bossOk ? 'ef-text-info' : 'ef-text-danger'} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User /> {t.requiredBoss}%</span>
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
                                <div className="ef-sans ef-text-muted" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '16px' }}><House weight="fill" /> LIFESTYLE & BENS</div>
                                <div className="ef-sans ef-text-main" style={{ display: 'flex', gap: '16px', marginBottom: '24px', fontSize: '0.85rem', background: '#1A1F24', padding: '12px' }}>
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
                                        const cardClass = `ef-shop-card${owned ? ' ef-shop-card--owned' : ''}${disabled && !owned ? ' ef-shop-card--disabled' : ''}`;
                                        return (
                                            <div key={id} className={cardClass}>
                                                <div className="ef-sans ef-text-main" style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span aria-hidden>{it.emoji}</span>
                                                    {owned && <CheckCircle weight="fill" size={14} className="ef-text-primary" />}
                                                    {it.name}
                                                </div>
                                                <div className={`ef-mono ${canAfford ? 'ef-text-primary' : 'ef-text-danger'}`} style={{ fontSize: '0.8rem', marginBottom: '16px' }}>R$ {it.cost.toLocaleString('pt-BR')}</div>
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
                        <EfButton key={n.view} variant="secondary" size="lg" className="ef-flex-1 ef-sans" style={{ justifyContent: 'center', padding: '24px', fontWeight: 'bold', fontSize: '1rem', gap: '8px' }} onClick={() => changeView(n.view)}>
                            {n.icon} {n.label}
                        </EfButton>
                    ))}
                </div>

                {/* Event Modals and Toasts */}
                {log && <div className="event-toast success" onClick={() => setLog('')}>{log}</div>}

                {offPitchEvent && (
                    <EfModal title="📰 Evento da Semana" onClose={() => setOffPitchEvent(null)}>
                        <p className="ef-sans" style={{ marginBottom: '24px', fontSize: '1rem', lineHeight: 1.5 }}>{offPitchEvent.text}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {offPitchEvent.options.map((opt, i) => (
                                <EfButton key={i} variant="secondary" onClick={() => handleOffPitchChoice(opt)} className="ef-sans" style={{ justifyContent: 'flex-start', padding: '16px' }}>{opt.label}</EfButton>
                            ))}
                        </div>
                    </EfModal>
                )}

                {mentalBreakModal && (
                    <EfModal title="🧠 CRISE MENTAL" onClose={() => {}}>
                        <p className="ef-sans ef-text-danger" style={{ fontWeight: 'bold', marginBottom: '8px' }}>Stress em {player.stress}%</p>
                        <p className="ef-sans" style={{ marginBottom: '24px', fontSize: '0.9rem', lineHeight: 1.5 }}>Você não aguenta mais a pressão. Precisa de uma válvula de escape.</p>
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
