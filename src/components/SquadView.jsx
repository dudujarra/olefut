import React, { useState } from 'react';
import '../styles/squad-view.css';
import { useGame } from '../context/GameContext';
import { ViewOnboarding } from './ViewOnboarding';
import { electStarPlayer } from '../engine/StarPlayerLink';
import { Help } from './Help';
import { EfClubBadge } from './ui/EfClubBadge';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';
import { HexagonChart } from './HexagonChart';
import { calculateRatingForPosition } from '../engine/Positions';
import { injectSquadIntoTeam } from '../services/SquadDataService';

import { Users, User, ChartBar, Star, Sparkle, MagnifyingGlass, CheckCircle, PaperPlaneRight, UserMinus, Heartbeat, ArrowCircleUp, ArrowCircleDown, MinusCircle, IdentificationCard, FirstAid } from '@phosphor-icons/react';

export function SquadView() {
    const { gameState, changeView, getEngine, forceUpdate } = useGame();
    const engine = getEngine();
    const team = engine.getTeam(gameState.teamId);

    const [filterPos, setFilterPos] = useState('all');
    const [sortBy, setSortBy] = useState('position');
    const [search, setSearch] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [loadingReal, setLoadingReal] = useState(false);
    const [tab, setTab] = useState('plantel');

    const handleLoadRealSquad = async () => {
        if (!team) return;
        setLoadingReal(true);
        const result = await injectSquadIntoTeam(engine, team.id, team.name);
        setLoadingReal(false);
        if (result.success) {
            forceUpdate();
        } else {
            alert(`Squad real não disponível: ${result.msg || 'pre-bake pendente'}`);
        }
    };

    if (!team) return null;

    const posOrder = { GOL: 0, DEF: 1, MEI: 2, ATA: 3 };
    let filtered = [...team.squad];
    if (filterPos !== 'all') filtered = filtered.filter(p => p.position === filterPos);
    if (search.trim()) {
        const q = search.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
    }
    const sorters = {
        position: (a, b) => posOrder[a.position] - posOrder[b.position] || b.ovr - a.ovr,
        ovr: (a, b) => b.ovr - a.ovr,
        age: (a, b) => a.age - b.age,
        energy: (a, b) => b.energy - a.energy,
        name: (a, b) => a.name.localeCompare(b.name),
        moral: (a, b) => (b.moral || 50) - (a.moral || 50),
    };
    const sorted = filtered.sort(sorters[sortBy] || sorters.position);

    const handleSort = (key) => setSortBy(key);

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
        engine.sellPlayer(player.id, price);
        forceUpdate();
    };

    const back = gameState.mode === 'player' ? 'player_dashboard' : 'dashboard';
    const loanedOut = engine.loanedOut || [];

    // SPEC-176/183: Stitch v1.1 condition bar (% + horizontal fill)
    const renderConditionBar = (energy) => {
        const pct = Math.max(0, Math.min(100, Math.round(energy)));
        const tone = pct > 60 ? 'ok' : pct > 30 ? 'warn' : 'danger';
        return (
            <div className="ef-squad__cond">
                <span className={`ef-squad__cond-pct ef-squad__cond-pct--${tone}`}>{pct}%</span>
                <div className="ef-squad__cond-track">
                    <div className={`ef-squad__cond-fill ef-squad__cond-fill--${tone}`} style={{ width: `${pct}%` }} />
                </div>
            </div>
        );
    };

    const getMoralIcon = (m) => {
        if (m > 70) return <ArrowCircleUp weight="fill" color="var(--primary)" />;
        if (m > 40) return <MinusCircle weight="fill" color="var(--text-muted)" />;
        return <ArrowCircleDown weight="fill" color="var(--danger)" />;
    };

    const getFormTrendIcon = (trend) => {
        if (trend === 'up') return <ArrowCircleUp size={14} weight="fill" color="var(--primary)" />;
        if (trend === 'down') return <ArrowCircleDown size={14} weight="fill" color="var(--danger)" />;
        return null;
    };

    const getPosColor = (pos) => {
        if (pos === 'GOL') return 'var(--accent)';
        if (pos === 'DEF') return 'var(--info)';
        if (pos === 'MEI') return 'var(--primary)';
        if (pos === 'ATA') return 'var(--danger)';
        return 'var(--text-muted)';
    };

    return (
        <div className="ef-view-shell ef-view-shell--fixed">
            <ViewOnboarding viewId="squad" />
            <div className="ef-view-container ef-view-container--wide">

                {/* === HEADER — Stitch v1.1 plantel hero (badge + capacity bar) === */}
                <EfPanel variant="hero" padding="lg" className="ef-squad__header">
                    <div className="ef-squad__identity">
                        <EfClubBadge name={team.name} size="lg" />
                        <div className="ef-squad__identity-col">
                            <h2 className="ef-heading-xl ef-squad__team-name">
                                {team.name?.toUpperCase()}
                            </h2>
                            <div className="ef-squad__capacity">
                                <div className="ef-squad__capacity-track">
                                    <div
                                        className="ef-squad__capacity-fill"
                                        style={{ width: `${Math.min(100, (team.squad.length / 30) * 100)}%` }}
                                    />
                                </div>
                                <span className="ef-squad__capacity-label">
                                    <Users weight="fill" /> {team.squad.length}/30 JOGADORES NO PLANTEL
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="ef-squad__header-right">
                        <div className="ef-squad__action-block">
                            <EfButton variant="secondary" size="md" onClick={() => changeView(back)} className="ef-squad__btn-bold">VOLTAR</EfButton>
                            <EfButton variant="primary" size="md" title="Carrega o plantel real do clube via dataset pre-bake (substitui jogadores gerados)" onClick={handleLoadRealSquad} disabled={loadingReal} className="ef-squad__btn-bold">
                                {loadingReal ? 'CARREGANDO...' : 'PLANTEL REAL'}
                            </EfButton>
                        </div>
                        {team.manager && team.manager.name && (
                            <div className="ef-tag-mono ef-tag-mono--info">
                                <User weight="fill" /> TREINADOR: {team.manager.name.toUpperCase()}
                            </div>
                        )}
                        {team.manager?.stats && (
                            <div className="ef-squad__manager-stats">
                                {team.manager.stats.wins || 0}V <span>{team.manager.stats.draws || 0}E</span> <span className="ef-text-danger">{team.manager.stats.losses || 0}D</span>
                            </div>
                        )}
                    </div>
                </EfPanel>

                {/* Tabs & Filters Bento */}
                <EfPanel padding="md" className="ef-squad__tab-toolbar">
                    <div className="ef-squad__flex-gap">
                        {[
                            { id: 'plantel', label: 'PLANTEL', icon: <Users size={16} /> },
                            { id: 'stats', label: 'ANÁLISE TÁTICA', icon: <ChartBar size={16} /> },
                            { id: 'contratos', label: 'FINANÇAS', icon: <IdentificationCard size={16} /> }
                        ].map(t => (
                            <EfButton key={t.id} onClick={() => setTab(t.id)} variant={tab === t.id ? 'primary' : 'secondary'} size="md" className="ef-squad__tab-btn">
                                {t.icon} {t.label}
                            </EfButton>
                        ))}
                    </div>

                    <div className="ef-squad__flex-gap">
                        <div className="ef-search-wrap">
                            <MagnifyingGlass size={16} className="ef-search-wrap__icon" />
                            <input type="text" placeholder="Buscar jogador..." value={search} onChange={(e) => setSearch(e.target.value)} className="ef-input ef-input--search" />
                        </div>
                        <select value={filterPos} onChange={(e) => setFilterPos(e.target.value)} className="ef-select">
                            <option value="all">Todas as posições</option>
                            <option value="GOL">GOL</option>
                            <option value="DEF">DEF</option>
                            <option value="MEI">MEI</option>
                            <option value="ATA">ATA</option>
                        </select>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="ef-select">
                            <option value="position">Ordenação: POS</option>
                            <option value="ovr">Ordenação: OVR ↓</option>
                            <option value="age">Ordenação: IDADE</option>
                            <option value="energy">Ordenação: COND ↓</option>
                        </select>
                    </div>
                </EfPanel>

                {/* Main Content Area */}
                {tab === 'plantel' && (
                    <EfPanel padding="none" className="ef-squad__panel-table">
                        <table className="ef-squad__table">
                            <thead className="ef-squad__thead">
                                <tr>
                                    <th className="ef-squad__th ef-squad__th--narrow">ST</th>
                                    <th onClick={() => handleSort('position')} className={`${sortBy === 'position' ? 'ef-text-primary' : 'ef-text-muted'} ef-squad__th ef-squad__th--pos`}>POS</th>
                                    <th onClick={() => handleSort('name')} className={`${sortBy === 'name' ? 'ef-text-primary' : 'ef-text-muted'} ef-squad__th ef-squad__th--name ef-squad__th--sortable`}>JOGADOR</th>
                                    <th onClick={() => handleSort('ovr')} className={`${sortBy === 'ovr' ? 'ef-text-primary' : 'ef-text-muted'} ef-squad__th ef-squad__th--pos`}>OVR</th>
                                    <th onClick={() => handleSort('energy')} className={`${sortBy === 'energy' ? 'ef-text-primary' : 'ef-text-muted'} ef-squad__th ef-squad__th--energy ef-squad__th--sortable`}>COND</th>
                                    <th onClick={() => handleSort('moral')} className={`${sortBy === 'moral' ? 'ef-text-primary' : 'ef-text-muted'} ef-squad__th ef-squad__th--mor ef-squad__th--sortable`}>MOR</th>
                                    <th className="ef-squad__th ef-squad__th--action">AÇÃO</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((p) => {
                                    const isSelected = p.isTitular;
                                    const rowCls = [
                                        'ef-squad__row',
                                        isSelected ? 'ef-squad__row--selected' : '',
                                        p.injury ? 'ef-squad__row--injured' : ''
                                    ].filter(Boolean).join(' ');
                                    return (
                                        <React.Fragment key={p.id}>
                                            <tr
                                                className={rowCls}
                                                onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                                            >
                                                <td className="ef-squad__td">
                                                    {p.injury ? (
                                                        <FirstAid weight="fill" size={16} className="ef-squad__status-medical" />
                                                    ) : (
                                                        <div
                                                            onClick={(e) => { e.stopPropagation(); toggleTitular(p.id); }}
                                                            className={`ef-st-toggle${isSelected ? ' ef-st-toggle--active' : ''}`}
                                                            title={'Alternar Titular/Reserva (titular ganha XP em jogo; reserva acumula desmotivação se não for usado)'}
                                                        >
                                                            {isSelected
                                                                ? <CheckCircle weight="bold" color="var(--primary)" size={16} />
                                                                : <span className="ef-squad__status-dot" aria-hidden="true" />}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="ef-squad__td">
                                                    <span className={`ef-squad__pos-badge ef-squad__pos-badge--${(p.position || '').toLowerCase()}`}>
                                                        {p.naturalPosition || p.position}
                                                    </span>
                                                </td>
                                                <td className="ef-squad__name-cell">
                                                    <div className="ef-squad__name-col">
                                                        <div className="ef-squad__name-row">
                                                            {p.isSuper && <Star weight="fill" color="var(--accent)" size={14} />}
                                                            {p.isWonderkid && <Sparkle weight="fill" color="var(--color-purple-wonder)" size={14} />}
                                                            {p.nickname ? `"${p.nickname}" ${p.name.split(' ').pop()}` : p.name}
                                                            {getFormTrendIcon(p.form?.trend)}
                                                        </div>
                                                        {p.injury ? (
                                                            <div className="ef-squad__sub-label ef-squad__sub-label--danger">
                                                                LESIONADO{p.injury?.weeksRemaining ? ` (${p.injury.weeksRemaining} SEM)` : ''}
                                                            </div>
                                                        ) : (
                                                            <div className="ef-squad__sub-label">
                                                                {p.age} ANOS{p.specialty ? ` • ${p.specialty}` : ''}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="ef-squad__ovr-cell">
                                                    {p.ovr}
                                                </td>
                                                <td className="ef-squad__td ef-squad__td--cond">
                                                    {renderConditionBar(p.energy)}
                                                </td>
                                                <td className="ef-squad__td">
                                                    <div className="ef-squad__mor">
                                                        {getMoralIcon(p.moral || 50)}
                                                        <span className="ef-mono ef-squad__mor-num">{p.moral || 50}</span>
                                                    </div>
                                                </td>
                                                <td className="ef-squad__td">
                                                    <div className="ef-squad__flex-center-gap">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); if (!p.injury) toggleTitular(p.id); }}
                                                            disabled={!!p.injury}
                                                            title={p.injury ? 'Lesionado — fora da escalação até recuperar' : (isSelected ? 'Mover para reservas' : 'Escalar como titular')}
                                                            className={`ef-squad__action-pill${p.injury ? ' ef-squad__action-pill--blocked' : ''}${isSelected ? ' ef-squad__action-pill--active' : ''}`}
                                                        >
                                                            {p.injury ? 'BLOQ.' : (isSelected ? 'TIT.' : 'ESCALAR')}
                                                        </button>
                                                        {!p.isTitular && !p.injury && p.age <= 23 && (
                                                            <button title="Emprestar (jovem ganha minutos em outro clube; volta com XP)" onClick={(e) => { e.stopPropagation(); handleLoan(p.id); }} className="ef-icon-btn ef-icon-btn--info">
                                                                <PaperPlaneRight size={16} weight="bold" />
                                                            </button>
                                                        )}
                                                        {!p.isTitular && (
                                                            <button title="Vender jogador direto (sem negociação, valor de mercado fixo)" onClick={(e) => { e.stopPropagation(); handleSell(p); }} className="ef-icon-btn ef-icon-btn--danger">
                                                                <UserMinus size={16} weight="bold" />
                                                            </button>
                                                        )}
                                                        {/* SPEC-C2.2: eleger estrela */}
                                                        <button
                                                            title={engine.starPlayerId === p.id ? 'Estrela do clube' : 'Eleger como estrela'}
                                                            onClick={(e) => { e.stopPropagation(); electStarPlayer(engine, engine.starPlayerId === p.id ? null : p.id); forceUpdate(); }}
                                                            className={engine.starPlayerId === p.id ? 'ef-icon-btn ef-icon-btn--accent' : 'ef-icon-btn'}
                                                        >
                                                            <Star size={16} weight={engine.starPlayerId === p.id ? 'fill' : 'regular'} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedId === p.id && (
                                                <tr key={`${p.id}-details`} className="ef-squad__details-row">
                                                    <td colSpan="7" className="ef-squad__details-cell">
                                                        <div className="ef-squad__details-flex">
                                                            <div className="ef-squad__details-box">
                                                                <HexagonChart player={p} size={180} />
                                                            </div>
                                                            <div className="ef-squad__details-col">
                                                                <div className="ef-sans ef-text-main" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                                                    {p.name}
                                                                </div>
                                                                <div className="ef-mono ef-text-muted" style={{ display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
                                                                    {p.personality && (
                                                                        <div>
                                                                            <Heartbeat weight="fill" /> {p.personality} • {p.playstyle || 'Caneleiro'}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="ef-mono" style={{ display: 'flex', gap: '24px', marginTop: '12px' }}>
                                                                    <div style={{ background: 'var(--bg-panel)', padding: '12px 16px', borderLeft: '3px solid var(--primary)' }}>
                                                                        <div className="ef-text-muted" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>OVR / POT</div>
                                                                        <div className="ef-text-main" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{p.ovr} <span style={{ color: 'var(--border-panel)', fontSize: '1rem', fontWeight: 'normal' }}>/</span> <span className={p.potential > p.ovr + 5 ? 'ef-text-primary' : 'ef-text-muted'}>{p.potential || p.ovr}</span></div>
                                                                    </div>
                                                                    <div style={{ background: 'var(--bg-panel)', padding: '12px 16px', borderLeft: '3px solid var(--accent)' }}>
                                                                        <div className="ef-text-muted" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>VALOR DE MERCADO</div>
                                                                        <div className="ef-text-accent" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>R$ {((p.marketValue || p.value) / 1e6).toFixed(1)}M</div>
                                                                    </div>
                                                                    <div style={{ background: 'var(--bg-panel)', padding: '12px 16px', borderLeft: '3px solid var(--info)' }}>
                                                                        <div className="ef-text-muted" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>RATING (POS)</div>
                                                                        <div className="ef-text-info" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{p.attacking ? calculateRatingForPosition(p, p.naturalPosition || 'MEC') : p.ovr}</div>
                                                                    </div>
                                                                </div>
                                                                {p.personality && (
                                                                    <div className="ef-sans" style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-purple-dark)', padding: '6px 12px', border: '1px solid var(--color-purple-wonder)', color: 'var(--color-purple-wonder)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                                        <Heartbeat weight="fill" /> PERFIL: {p.personality}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </EfPanel>
                )}

                {/* === FOOTER STATS — Stitch v1.1 plantel summary === */}
                {tab === 'plantel' && (() => {
                    const count = sorted.length || 1;
                    const sumOvr = sorted.reduce((acc, p) => acc + (p.ovr || 0), 0);
                    const sumEnergy = sorted.reduce((acc, p) => acc + (p.energy || 0), 0);
                    const sumMoral = sorted.reduce((acc, p) => acc + (p.moral || 50), 0);
                    const avgOvr = (sumOvr / count).toFixed(1);
                    const avgEnergy = Math.round(sumEnergy / count);
                    const avgMoral = Math.round(sumMoral / count);
                    const moralLabel = avgMoral > 70 ? 'FORTE' : avgMoral > 40 ? 'NEUTRA' : 'FRACA';
                    const MoralIcon = avgMoral > 70 ? ArrowCircleUp : avgMoral > 40 ? MinusCircle : ArrowCircleDown;
                    const moralCls = avgMoral > 70 ? 'ef-text-primary' : avgMoral > 40 ? 'ef-text-muted' : 'ef-text-danger';
                    return (
                        <EfPanel padding="md" className="ef-squad__summary">
                            <div className="ef-squad__summary-cell">
                                <span className="ef-squad__summary-label">MÉDIA OVR</span>
                                <span className="ef-squad__summary-value ef-text-accent">{avgOvr}</span>
                            </div>
                            <div className="ef-squad__summary-cell">
                                <span className="ef-squad__summary-label">COND. MÉDIA</span>
                                <div className="ef-squad__summary-cond">
                                    <span className="ef-squad__summary-value ef-text-primary">{avgEnergy}%</span>
                                    <div className="ef-squad__summary-bar">
                                        <div className="ef-squad__summary-bar-fill" style={{ width: `${avgEnergy}%` }} />
                                    </div>
                                </div>
                            </div>
                            <div className="ef-squad__summary-cell">
                                <span className="ef-squad__summary-label">MORAL EQUIPE</span>
                                <div className={`ef-squad__summary-moral ${moralCls}`}>
                                    <MoralIcon weight="fill" size={20} />
                                    <span className="ef-squad__summary-value">{moralLabel}</span>
                                </div>
                            </div>
                        </EfPanel>
                    );
                })()}

                {tab === 'stats' && (
                    <EfPanel padding="md">
                        <div className="ef-squad__section-header-mb">
                            <ChartBar size={24} color="var(--primary)" weight="fill" />
                            <h3>ANÁLISE TITULARES (TOP 11)</h3>
                        </div>
                        <div className="ef-squad__grid-md">
                            {sorted.filter(p => p.isTitular).slice(0, 11).map(p => (
                                <div key={p.id} style={{ background: 'var(--bg-panel)', border: '1px solid var(--color-soft-border)', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div className="ef-sans ef-text-main" style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '8px', textAlign: 'center' }}>{p.name}</div>
                                    <div className="ef-mono" style={{ fontSize: '0.8rem', color: getPosColor(p.position), fontWeight: 'bold', marginBottom: '16px', background: 'var(--bg-dark)', padding: '4px 12px' }}>{p.naturalPosition || p.position}</div>
                                    <HexagonChart player={p} size={160} />
                                </div>
                            ))}
                        </div>
                    </EfPanel>
                )}

                {tab === 'contratos' && (
                    <EfPanel padding="none" className="ef-squad__panel-table">
                        <div className="ef-section-header" style={{ padding: '24px', marginBottom: 0, borderBottom: '2px solid var(--color-soft-border)' }}>
                            <IdentificationCard size={24} color="var(--accent)" weight="fill" />
                            <h3>GESTÃO DE CONTRATOS</h3>
                        </div>
                        <table className="ef-squad__table">
                            <thead className="ef-squad__thead">
                                <tr>
                                    <th className="ef-text-muted" style={{ textAlign:'left', padding: '16px', fontSize: '0.75rem', fontWeight: 'bold' }}>JOGADOR</th>
                                    <th className="ef-text-muted" style={{ textAlign:'center', padding: '16px', fontSize: '0.75rem', fontWeight: 'bold' }}>POS</th>
                                    <th className="ef-text-muted" style={{ textAlign:'center', padding: '16px', fontSize: '0.75rem', fontWeight: 'bold' }}>IDADE</th>
                                    <th className="ef-squad__th ef-squad__th--wage-right">WAGE/SEM</th>
                                    <th className="ef-squad__th ef-squad__th--wage-right">RESTANTE</th>
                                    <th className="ef-squad__th ef-squad__th--wage-right">CLÁUSULA</th>
                                    <th className="ef-squad__th ef-squad__th--wage-right">VALOR</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((p, i) => (
                                    <tr key={p.id} style={{ background: i % 2 === 0 ? 'var(--bg-panel)' : 'var(--bg-panel)', borderBottom: '1px solid var(--bg-panel)' }}>
                                        <td className="ef-text-main" style={{ fontWeight: 'bold', padding: '16px' }}>{p.name}</td>
                                        <td className="ef-mono" style={{ textAlign:'center', color: getPosColor(p.position), fontSize: '0.8rem', fontWeight: 'bold', padding: '16px' }}>{p.naturalPosition || p.position}</td>
                                        <td className="ef-mono ef-text-muted" style={{ textAlign:'center', padding: '16px' }}>{p.age}</td>
                                        <td className="ef-mono ef-text-danger" style={{ textAlign:'right', padding: '16px' }}>R$ {(p.contract?.weeklyWage || 0).toLocaleString('pt-BR')}</td>
                                        <td className="ef-mono ef-text-muted" style={{ textAlign:'right', padding: '16px' }}>{p.contract?.weeksRemaining || p.contract?.weeksLeft || '-'} sem</td>
                                        <td className="ef-mono ef-text-info" style={{ textAlign:'right', padding: '16px' }}>{p.contract?.releaseClause ? `R$ ${(p.contract.releaseClause / 1e6).toFixed(1)}M` : '-'}</td>
                                        <td className="ef-mono ef-text-accent" style={{ textAlign:'right', padding: '16px' }}>{p.marketValue ? `R$ ${(p.marketValue / 1e6).toFixed(1)}M` : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </EfPanel>
                )}

                {loanedOut.length > 0 && (
                    <EfPanel padding="md" className="ef-squad__warning-panel">
                        <div className="ef-squad__h3-accent">
                            <PaperPlaneRight size={24} color="var(--accent)" weight="fill" />
                            <h3 className="ef-squad__h3-accent">JOGADORES EMPRESTADOS ({loanedOut.length})</h3>
                        </div>
                        <div className="ef-squad__grid-lg">
                            {loanedOut.map((l, i) => (
                                <div key={i} style={{ background: 'var(--bg-panel)', padding: '16px', border: '1px solid var(--border-panel)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="ef-sans ef-text-main" style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                        {l.playerName} <span className="ef-text-muted" style={{ fontWeight: 'normal', display: 'block', marginTop: '4px', fontSize: '0.8rem' }}>→ {l.destination}</span>
                                    </div>
                                    <div className="ef-mono ef-text-accent" style={{ fontSize: '0.85rem', background: 'var(--bg-dark)', padding: '6px 12px' }}>
                                        {l.weeksLeft}/{l.totalWeeks} sem
                                    </div>
                                </div>
                            ))}
                        </div>
                    </EfPanel>
                )}
            </div>
        </div>
    );
}

export default SquadView;
