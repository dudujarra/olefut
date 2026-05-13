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
import '../styles/player-dashboard-view.css';

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

    if (!player || !team) return <div className="ef-player-dashboard__error ef-mono ef-text-main">Erro: jogador não encontrado.</div>;

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
            ? 'ef-player-dashboard__bar-fill--danger'
            : type === 'fans'
                ? ''
                : type === 'teammates'
                    ? 'ef-player-dashboard__bar-fill--accent'
                    : 'ef-player-dashboard__bar-fill--info';
        return (
            <div className="ef-player-dashboard__rel-bar">
                <label className="ef-player-dashboard__rel-label ef-sans ef-text-muted">
                    <span className="ef-player-dashboard__rel-icon">{icon} {label}</span>
                    <span className="ef-player-dashboard__rel-value ef-mono">{value}%</span>
                </label>
                <div className="ef-player-dashboard__bar">
                    <div className={`ef-player-dashboard__bar-fill ${fillMod}`} style={{ width: `${value}%` }} />
                </div>
            </div>
        );
    };

    const starStr = Array(player.starRating).fill(<Star weight="fill" color="var(--accent)" size={16} />).concat(Array(5 - player.starRating).fill(<Star color="var(--border-panel)" size={16} />));
    const pers = PERSONALITIES[player.personality] || PERSONALITIES.maverick;
    const stressColor = player.stress >= 75 ? 'var(--danger)' : player.stress >= 50 ? 'var(--accent)' : 'var(--text-muted)';

    return (
        <div className="ef-view-shell ef-view-shell--fixed">
            <div className="ef-view-container ef-view-container--wide">
                {banner && <EfBanner type={banner} onDismiss={() => setBanner(null)} />}

                {/* === HEADER — LUXURY BENTO === */}
                <EfPanel variant="hero" padding="lg" className="ef-player-dashboard__header">
                    <div className="ef-player-dashboard__header-left">
                        {team?.name && <EfClubBadge name={team.name} size="lg" />}
                        <div className="ef-player-dashboard__player-info">
                            <div className="ef-tag-mono">
                                <span aria-hidden>{pers.emoji}</span> {pers.name.toUpperCase()} • SÉRIE {['A','B','C','D'][team.division - 1]}
                            </div>
                            <h2 className="ef-heading-xl ef-player-dashboard__player-name">
                                {player.name}
                            </h2>
                            <div className="ef-player-dashboard__player-meta">
                                {starStr.map((s, i) => <React.Fragment key={i}>{s}</React.Fragment>)}
                                <span className="ef-mono ef-text-muted">
                                    {player.position} • {team.name}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="ef-player-dashboard__header-right">
                        <div className="ef-player-dashboard__money ef-mono">
                            R$ {(player.money).toLocaleString('pt-BR')}
                        </div>
                        <div className="ef-tag-mono ef-tag-mono--accent">
                            <SoccerBall weight="fill" /> {player.seasonGoals} GOLS NA TEMPORADA
                        </div>
                        <div className="ef-player-dashboard__action-slots">
                            <div className="ef-player-dashboard__action-slots-label ef-mono">
                                <span>SEM {engine.currentWeek}/38</span>
                                <span>AÇÕES</span>
                            </div>
                            <div className="ef-player-dashboard__action-slots-bar">
                                {Array.from({ length: player.maxActionSlots }).map((_, i) => (
                                    <div key={i} className={`ef-action-slot${i < player.actionSlots ? ' ef-action-slot--filled' : ''}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                </EfPanel>

                {/* === ALERTS === */}
                {(player.isBenched || player.stress >= 75 || player.energy < 30) && (
                    <div className="ef-player-dashboard__alerts">
                        {player.isBenched && <EfPanel padding="sm" className="ef-player-dashboard__alert-panel"><WarningCircle color="var(--color-danger)" weight="fill" /><span className="ef-player-dashboard__alert-text ef-mono">VOCÊ ESTÁ NO BANCO!</span></EfPanel>}
                        {player.stress >= 75 && <EfPanel padding="sm" className="ef-player-dashboard__alert-panel"><Brain color="var(--color-danger)" weight="fill" /><span className="ef-player-dashboard__alert-text ef-mono">STRESS CRÍTICO ({player.stress}%)</span></EfPanel>}
                        {player.energy < 30 && <EfPanel padding="sm" className="ef-player-dashboard__alert-panel"><Lightning color="var(--color-danger)" weight="fill" /><span className="ef-player-dashboard__alert-text ef-mono">EXAUSTÃO ({player.energy}%)</span></EfPanel>}
                    </div>
                )}

                {/* === BENTO GRID LAYOUT === */}
                <div className="ef-player-dashboard__container">
                    {/* LEFT COLUMN: Navigation & Actions */}
                    <div className="ef-player-dashboard__sidebar">
                        <EfPanel padding="md" className="ef-player-dashboard__nav-panel">
                            {[{id:'overview',label:'Visão Geral'},{id:'skills',label:'Treinamento'},{id:'store',label:'Loja de Traits'},{id:'lifestyle',label:'Lifestyle'}].map(t => (
                                <EfButton key={t.id} variant={tab === t.id ? 'primary' : 'secondary'} size="md" onClick={() => setTab(t.id)} className="ef-sans ef-player-dashboard__nav-btn">
                                    {t.label}
                                </EfButton>
                            ))}
                        </EfPanel>

                        <EfButton variant="primary" size="lg" className="ef-sans ef-player-dashboard__advance-button ef-player-dashboard__advance-btn" onClick={handleAdvance}>
                            <SoccerBall weight="fill" /> AVANÇAR SEMANA
                        </EfButton>
                    </div>

                    {/* RIGHT COLUMN: Content Area */}
                    <div className="ef-player-dashboard__content">

                        {/* GLOBAL STATUS BAR */}
                        <EfPanel padding="md" className="ef-player-dashboard__status-bar">
                            <div className="ef-player-dashboard__status-cells">
                                <div className="ef-player-dashboard__overview-cell">
                                    <span className={`ef-player-dashboard__cell-value ${player.energy < 30 ? 'ef-player-dashboard__cell-value--critical' : 'ef-player-dashboard__cell-value--healthy'}`}><Lightning weight="fill" /> {player.energy}%</span>
                                    <span className="ef-player-dashboard__cell-label">ENERGIA</span>
                                </div>
                                <div className="ef-player-dashboard__overview-cell">
                                    <span className="ef-player-dashboard__cell-value" style={{ color: stressColor }}><Brain weight="fill" /> {player.stress}%</span>
                                    <span className="ef-player-dashboard__cell-label">STRESS</span>
                                </div>
                                <div className="ef-player-dashboard__overview-cell">
                                    <span className="ef-player-dashboard__cell-value ef-text-info"><Storefront weight="fill" /> {player.energyDrinks}</span>
                                    <span className="ef-player-dashboard__cell-label">ENERGÉTICOS</span>
                                </div>
                            </div>
                            <div className="ef-player-dashboard__status-actions">
                                <EfButton variant="secondary" size="sm" onClick={handleRest} disabled={!player.canAct}><Lightning /> DESCANSAR</EfButton>
                                <EfButton variant="secondary" size="sm" onClick={handleBuyDrink}><ShoppingCart /> COMPRAR (R$100)</EfButton>
                                <EfButton variant="secondary" size="sm" onClick={handleUseDrink} disabled={player.energyDrinks <= 0}><Storefront /> USAR BEBIDA</EfButton>
                            </div>
                        </EfPanel>

                        {/* TAB CONTENTS */}
                        {tab === 'overview' && (
                            <div className="ef-player-dashboard__overview-grid">
                                <div className="ef-player-dashboard__overview-column">
                                    <EfPanel padding="md">
                                        <div className="ef-player-dashboard__panel-title ef-sans ef-text-muted"><Handshake weight="fill" /> RELACIONAMENTOS</div>
                                        <RelBar label="Treinador" value={player.relationships.boss} type="boss" icon={<User weight="fill" />} />
                                        <RelBar label="Torcida" value={player.relationships.fans} type="fans" icon={<HandsClapping weight="fill" />} />
                                        <RelBar label="Companheiros" value={player.relationships.teammates} type="teammates" icon={<User weight="fill" />} />
                                        <RelBar label="Patrocinadores" value={player.relationships.sponsors} type="sponsors" icon={<Coins weight="fill" />} />
                                    </EfPanel>
                                </div>

                                <div className="ef-player-dashboard__col-stack">
                                    <EfPanel padding="md">
                                        <div className="ef-sans ef-text-muted ef-player-dashboard__panel-title-row"><Target weight="fill" /> ATRIBUTOS PRINCIPAIS</div>
                                        {[
                                            { key: 'technique', label: 'Técnica', color: 'var(--info)' },
                                            { key: 'pace',      label: 'Velocidade', color: 'var(--primary)' },
                                            { key: 'power',     label: 'Força', color: 'var(--danger)' },
                                            { key: 'vision',    label: 'Visão', color: 'var(--accent)' }
                                        ].map(s => {
                                            const lvl = player.skills[s.key] ?? 0;
                                            const prog = player.skillProgress?.[s.key] ?? 0;
                                            return (
                                                <div key={s.key} className="ef-player-dashboard__skill-row-mb">
                                                    <div className="ef-sans ef-text-main ef-player-dashboard__skill-head">
                                                        <span>{s.label}</span>
                                                        <span className="ef-mono">{lvl} <span className="ef-text-muted ef-player-dashboard__skill-xp">({prog}/100 XP)</span></span>
                                                    </div>
                                                    <div className="ef-bar">
                                                        <div className="ef-bar__fill" style={{ width: `${prog}%`, background: s.color }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </EfPanel>

                                    {offPitchResult && (
                                        <EfPanel padding="md" className="ef-player-dashboard__event-panel-inline">
                                            <div className="ef-sans ef-text-accent ef-player-dashboard__event-title-row"><WarningCircle weight="fill" /> ÚLTIMO EVENTO</div>
                                            <p className="ef-sans ef-text-main ef-player-dashboard__event-body-text">{offPitchResult}</p>
                                        </EfPanel>
                                    )}
                                </div>
                            </div>
                        )}

                        {tab === 'skills' && (
                            <div className="ef-player-dashboard__col-stack">
                                <EfPanel padding="md">
                                    <div className="ef-sans ef-text-muted ef-player-dashboard__panel-title-row"><TrendUp weight="fill" /> TREINAMENTO PRINCIPAL</div>
                                    <div className="ef-player-dashboard__training-grid">
                                        <EfButton variant="primary" size="lg" onClick={() => handleTrain('technique')} disabled={!player.canAct} className="ef-player-dashboard__training-btn">
                                            <Target size={24} /> <span>TÉCNICA</span>
                                        </EfButton>
                                        <EfButton variant="primary" size="lg" onClick={() => handleTrain('pace')} disabled={!player.canAct} className="ef-player-dashboard__training-btn">
                                            <Lightning size={24} /> <span>VELOCIDADE</span>
                                        </EfButton>
                                        <EfButton variant="primary" size="lg" onClick={() => handleTrain('power')} disabled={!player.canAct} className="ef-player-dashboard__training-btn">
                                            <Heartbeat size={24} /> <span>FORÇA</span>
                                        </EfButton>
                                        <EfButton variant="primary" size="lg" onClick={() => handleTrain('vision')} disabled={!player.canAct} className="ef-player-dashboard__training-btn">
                                            <Brain size={24} /> <span>VISÃO</span>
                                        </EfButton>
                                    </div>
                                </EfPanel>

                                <EfPanel padding="md">
                                    <div className="ef-player-dashboard__subattr-header-row">
                                        <div className="ef-sans ef-text-muted ef-player-dashboard__subattr-title"><ChartBar weight="fill" /> SUB-ATRIBUTOS ESPECÍFICOS</div>
                                        <EfButton size="sm" variant="secondary" onClick={() => setShowSubAttrs(!showSubAttrs)}>{showSubAttrs ? 'OCULTAR' : 'MOSTRAR'}</EfButton>
                                    </div>
                                    {showSubAttrs && player.subAttrs && (
                                        <div className="ef-player-dashboard__subattrs-grid">
                                            {Object.entries(SUB_ATTRIBUTES).map(([base, subs]) => (
                                                <div key={base} className="ef-player-dashboard__subattr-cat">
                                                    <div className="ef-sans ef-text-accent ef-player-dashboard__subattr-cat-title">{base}</div>
                                                    {subs.map(sub => {
                                                        const lvl = player.subAttrs[sub] ?? 0;
                                                        const prog = player.subAttrProgress?.[sub] ?? 0;
                                                        return (
                                                            <div key={sub} className="ef-player-dashboard__subattr-item-mb">
                                                                <div className="ef-sans ef-text-main ef-player-dashboard__subattr-item-head">
                                                                    <span>{sub} <strong className="ef-mono ef-text-info">{lvl}</strong></span>
                                                                    <EfButton size="sm" variant="secondary" onClick={() => handleTrainSubAttr(sub)} disabled={!player.canAct} className="ef-player-dashboard__subattr-train-btn">TREINAR</EfButton>
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
                                <div className="ef-sans ef-text-muted ef-player-dashboard__panel-title-row"><Storefront weight="fill" /> TRAITS ESPECIAIS</div>
                                <div className="ef-player-dashboard__store-grid-2">
                                    {Object.entries(TRAITS_CATALOG).map(([id, t]) => {
                                        const owned = player.traits?.includes(id);
                                        const canAfford = player.money >= t.cost;
                                        const bossOk = player.relationships.boss >= t.requiredBoss;
                                        const disabled = owned || !canAfford || !bossOk;
                                        const cardClass = `ef-shop-card${owned ? ' ef-shop-card--owned' : ''}${disabled && !owned ? ' ef-shop-card--disabled' : ''}`;
                                        return (
                                            <div key={id} className={cardClass}>
                                                <div className="ef-sans ef-text-main ef-player-dashboard__store-card-title">
                                                    {owned && <CheckCircle weight="fill" size={14} className="ef-text-primary" />}
                                                    {t.name}
                                                </div>
                                                <div className="ef-sans ef-text-muted ef-player-dashboard__store-card-desc">{t.description}</div>
                                                <div className="ef-mono ef-player-dashboard__store-card-footer">
                                                    <span className={canAfford ? 'ef-text-primary' : 'ef-text-danger'}>R$ {t.cost.toLocaleString('pt-BR')}</span>
                                                    <span className={`ef-player-dashboard__store-card-req ${bossOk ? 'ef-text-info' : 'ef-text-danger'}`}><User /> {t.requiredBoss}%</span>
                                                </div>
                                                <EfButton size="sm" variant={owned ? 'secondary' : 'primary'} onClick={() => handleBuyTrait(id)} disabled={disabled} className="ef-player-dashboard__store-card-btn">
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
                                <div className="ef-sans ef-text-muted ef-player-dashboard__panel-title-row"><House weight="fill" /> LIFESTYLE & BENS</div>
                                <div className="ef-sans ef-text-main ef-player-dashboard__lifestyle-status-row">
                                    <span className="ef-player-dashboard__lifestyle-item-row"><House color="var(--info)" weight="fill" /> {player.lifestyle?.ownedHouse ? LIFESTYLE_CATALOG[player.lifestyle.ownedHouse]?.name : 'Sem casa'}</span>
                                    <span className="ef-player-dashboard__lifestyle-item-row"><Car color="var(--accent)" weight="fill" /> {player.lifestyle?.ownedCar ? LIFESTYLE_CATALOG[player.lifestyle.ownedCar]?.name : 'Sem carro'}</span>
                                    <span className="ef-player-dashboard__lifestyle-item-row"><Heart color="var(--danger)" weight="fill" /> {player.lifestyle?.isMarried ? 'Casado' : 'Solteiro'}</span>
                                    <span className="ef-player-dashboard__lifestyle-item-row"><Smiley color="var(--primary)" weight="fill" /> Mood {player.lifestyle?.mood ?? 50}%</span>
                                </div>
                                <div className="ef-player-dashboard__lifestyle-grid-2">
                                    {Object.entries(LIFESTYLE_CATALOG).map(([id, it]) => {
                                        const owned = (it.type === 'house' && player.lifestyle?.ownedHouse === id) ||
                                                      (it.type === 'car' && player.lifestyle?.ownedCar === id) ||
                                                      (it.type === 'event' && id === 'wedding' && player.lifestyle?.isMarried);
                                        const canAfford = player.money >= it.cost;
                                        const disabled = owned || !canAfford;
                                        const cardClass = `ef-shop-card${owned ? ' ef-shop-card--owned' : ''}${disabled && !owned ? ' ef-shop-card--disabled' : ''}`;
                                        return (
                                            <div key={id} className={cardClass}>
                                                <div className="ef-sans ef-text-main ef-player-dashboard__lifestyle-card-title">
                                                    <span aria-hidden>{it.emoji}</span>
                                                    {owned && <CheckCircle weight="fill" size={14} className="ef-text-primary" />}
                                                    {it.name}
                                                </div>
                                                <div className={`ef-mono ef-player-dashboard__lifestyle-cost ${canAfford ? 'ef-text-primary' : 'ef-text-danger'}`}>R$ {it.cost.toLocaleString('pt-BR')}</div>
                                                <EfButton size="sm" variant={owned ? 'secondary' : 'primary'} onClick={() => handleBuyLifestyle(id)} disabled={disabled} className="ef-player-dashboard__store-card-btn">
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
                <div className="ef-player-dashboard__bottom-nav-row">
                    {[{view:'standings',icon:<ChartBar weight="fill"/>,label:'Tabela'},{view:'achievements',icon:<Target weight="fill"/>,label:'Conquistas'}].map(n => (
                        <EfButton key={n.view} variant="secondary" size="lg" className="ef-flex-1 ef-sans ef-player-dashboard__bottom-nav-btn" onClick={() => changeView(n.view)}>
                            {n.icon} {n.label}
                        </EfButton>
                    ))}
                </div>

                {/* Event Modals and Toasts */}
                {log && <div className="event-toast success" onClick={() => setLog('')}>{log}</div>}

                {offPitchEvent && (
                    <EfModal title="📰 Evento da Semana" onClose={() => setOffPitchEvent(null)}>
                        <p className="ef-sans ef-player-dashboard__modal-body">{offPitchEvent.text}</p>
                        <div className="ef-player-dashboard__modal-stack">
                            {offPitchEvent.options.map((opt, i) => (
                                <EfButton key={i} variant="secondary" onClick={() => handleOffPitchChoice(opt)} className="ef-sans ef-player-dashboard__modal-option-btn">{opt.label}</EfButton>
                            ))}
                        </div>
                    </EfModal>
                )}

                {mentalBreakModal && (
                    <EfModal title="🧠 CRISE MENTAL" onClose={() => {}}>
                        <p className="ef-sans ef-text-danger ef-player-dashboard__break-title">Stress em {player.stress}%</p>
                        <p className="ef-sans ef-player-dashboard__break-desc">Você não aguenta mais a pressão. Precisa de uma válvula de escape.</p>
                        <div className="ef-player-dashboard__modal-stack">
                            <EfButton variant="secondary" onClick={() => handleMentalBreak('party')} className="ef-player-dashboard__break-option">🎉 Sair pra festa (Stress -40, Treinador -10)</EfButton>
                            <EfButton variant="secondary" onClick={() => handleMentalBreak('isolation')} className="ef-player-dashboard__break-option">🏠 Isolamento total (Stress -30, Time -8)</EfButton>
                            <EfButton variant="secondary" onClick={() => handleMentalBreak('therapy')} className="ef-player-dashboard__break-option">🧑‍⚕️ Terapia R$2000 (Stress -20)</EfButton>
                        </div>
                    </EfModal>
                )}

            </div>
        </div>
    );
}

export default PlayerDashboardView;
