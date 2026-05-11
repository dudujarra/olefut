import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Help } from './Help';
import { EfClubBadge } from './ui/EfClubBadge';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';
import { PentagonChart } from './PentagonChart';
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

    const renderHealthBlocks = (energy) => {
        const blocks = [];
        for (let i = 0; i < 5; i++) {
            const threshold = (i + 1) * 20;
            let color = 'rgba(255,255,255,0.05)';
            if (energy >= threshold || energy > threshold - 10) {
                color = energy > 60 ? 'var(--primary)' : energy > 30 ? 'var(--accent)' : 'var(--danger)';
            }
            blocks.push(
                <div key={i} style={{
                    width: '6px', height: '14px', 
                    backgroundColor: color, 
                    border: '1px solid rgba(0,0,0,0.8)', 
                    boxShadow: color !== 'rgba(255,255,255,0.05)' ? `0 0 4px ${color}` : 'none'
                }} />
            );
        }
        return <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>{blocks}</div>;
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

    const fontMono = { fontFamily: "'JetBrains Mono', 'Geist Mono', monospace" };

    return (
        <div className="ef-anim-fade-in ef-layout-pitch">
            <div className="ef-layout-container" style={{ maxWidth: '1200px' }}>

                {/* Hero / Header Bento */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                    <EfPanel variant="elev" padding="md" className="ef-flex-col" style={{ justifyContent: 'center' }}>
                        <div className="ef-flex-row" style={{ width: '100%' }}>
                            <EfClubBadge name={team.name} size="lg" />
                            <div className="ef-flex-1">
                                <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)', letterSpacing: '-0.02em', fontFamily: 'Satoshi, sans-serif' }}>
                                    {team.name}
                                </h2>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Users size={16} /> Plantel: {sorted.length}/{team.squad.length}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                                <EfButton variant="secondary" size="sm" onClick={() => changeView(back)}>VOLTAR</EfButton>
                                <EfButton
                                    variant="primary" size="sm"
                                    onClick={handleLoadRealSquad}
                                    disabled={loadingReal}
                                    title="Carregar plantel real do SofaScore"
                                >
                                    {loadingReal ? 'CARREGANDO...' : 'PLANTEL REAL'}
                                </EfButton>
                            </div>
                        </div>
                    </EfPanel>

                    {/* Manager Card Bento */}
                    {team.manager && team.manager.name && (
                        <EfPanel variant="sunk" padding="md" style={{ borderTop: '2px solid var(--accent)' }}>
                            <div className="ef-flex-row">
                                <User size={48} weight="duotone" color="var(--accent)" />
                                <div className="ef-flex-1">
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: 'Outfit, sans-serif' }}>
                                        {team.manager.name}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Treinador {team.manager.country ? `• ${team.manager.country}` : ''}
                                        {team.manager.preferredFormation ? ` • Esquema: ${team.manager.preferredFormation}` : ''}
                                    </div>
                                </div>
                                {team.manager.stats && (
                                    <div style={{ fontSize: '0.8rem', textAlign: 'right', ...fontMono }}>
                                        <div style={{ color: 'var(--text-main)' }}>{team.manager.stats.total || 0} JOGOS</div>
                                        <div style={{ color: 'var(--primary)', marginTop: '4px' }}>{team.manager.stats.wins || 0}V <span style={{color: 'var(--accent)'}}>{team.manager.stats.draws || 0}E</span> <span style={{color: 'var(--danger)'}}>{team.manager.stats.losses || 0}D</span></div>
                                    </div>
                                )}
                            </div>
                        </EfPanel>
                    )}
                </div>

                {/* Tabs & Filters Bento */}
                <EfPanel variant="sunk" padding="sm" className="ef-flex-row-wrap" style={{ gap: '12px', background: 'var(--bg-dark)' }}>
                    <div style={{ display: 'flex', gap: '8px', flex: '1 1 auto' }}>
                        {[
                            { id: 'plantel', label: 'PLANTEL', icon: <Users size={16} /> },
                            { id: 'stats', label: 'ANÁLISE TÁTICA', icon: <ChartBar size={16} /> },
                            { id: 'contratos', label: 'FINANÇAS', icon: <IdentificationCard size={16} /> }
                        ].map(t => (
                            <EfButton
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                variant={tab === t.id ? 'primary' : 'secondary'}
                                size="sm"
                                style={{ flex: 1, display: 'flex', justifyContent: 'center' }}
                            >
                                {t.icon} {t.label}
                            </EfButton>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flex: '1 1 auto', justifyContent: 'flex-end' }}>
                        <div style={{ position: 'relative', flex: '1 1 200px' }}>
                            <MagnifyingGlass size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="ef-form-input"
                                style={{ width: '100%', paddingLeft: '32px' }}
                            />
                        </div>
                        <select value={filterPos} onChange={(e) => setFilterPos(e.target.value)} className="ef-form-select">
                            <option value="all">Todas as posições</option>
                            <option value="GOL">GOL</option>
                            <option value="DEF">DEF</option>
                            <option value="MEI">MEI</option>
                            <option value="ATA">ATA</option>
                        </select>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="ef-form-select">
                            <option value="position">Ord: POS</option>
                            <option value="ovr">Ord: OVR ↓</option>
                            <option value="age">Ord: IDADE</option>
                            <option value="energy">Ord: COND ↓</option>
                        </select>
                    </div>
                </EfPanel>

                {/* Main Content Area */}
                {tab === 'plantel' && (
                    <div className="ef-panel ef-panel-default ef-panel-p-sm" style={{ overflowX: 'auto', background: 'var(--bg-dark)' }}>
                        <table className="ef-table">
                            <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <tr>
                                    <th style={{ textAlign:'center', width: '40px' }}>ST</th>
                                    <th onClick={() => handleSort('position')} className={`sortable ${sortBy === 'position' ? 'active-sort' : ''}`} style={{ textAlign:'center', width: '70px' }}>POS</th>
                                    <th onClick={() => handleSort('name')} className={`sortable ${sortBy === 'name' ? 'active-sort' : ''}`} style={{ textAlign:'left' }}>JOGADOR</th>
                                    <th onClick={() => handleSort('ovr')} className={`sortable ${sortBy === 'ovr' ? 'active-sort' : ''}`} style={{ textAlign:'center', width: '70px' }}>OVR</th>
                                    <th onClick={() => handleSort('energy')} className={`sortable ${sortBy === 'energy' ? 'active-sort' : ''}`} style={{ textAlign:'center', width: '100px' }}>COND</th>
                                    <th onClick={() => handleSort('moral')} className={`sortable ${sortBy === 'moral' ? 'active-sort' : ''}`} style={{ textAlign:'center', width: '60px' }}>MOR</th>
                                    <th style={{ textAlign:'center', width: '80px' }}>AÇÃO</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((p, index) => {
                                    const isSelected = p.isTitular;
                                    return (
                                        <React.Fragment key={p.id}>
                                            <tr 
                                                style={{
                                                    background: index % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                                                    opacity: p.injury ? 0.6 : 1,
                                                    cursor: 'pointer',
                                                    borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent'
                                                }}
                                                onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                                            >
                                                <td style={{ textAlign:'center', padding: '10px 4px' }}>
                                                    <div
                                                        onClick={(e) => { e.stopPropagation(); toggleTitular(p.id); }}
                                                        style={{
                                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                            width: '20px', height: '20px',
                                                            background: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                            border: '1px solid',
                                                            borderColor: isSelected ? 'var(--primary)' : 'var(--border-subtle)',
                                                            borderRadius: '2px',
                                                            cursor: p.injury ? 'not-allowed' : 'pointer',
                                                            boxShadow: isSelected ? '0 0 8px var(--primary-glow)' : 'none'
                                                        }}
                                                        title={p.injury ? 'Lesionado' : 'Alternar Titular'}
                                                    >
                                                        {isSelected && <CheckCircle weight="bold" color="#040805" size={14} />}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign:'center' }}>
                                                    <span style={{
                                                        color: '#040805',
                                                        background: p.position === 'GOL' ? 'var(--accent)' : 
                                                               p.position === 'DEF' ? 'var(--info)' : 
                                                               p.position === 'MEI' ? 'var(--primary)' : 'var(--danger)',
                                                        padding: '2px 6px',
                                                        fontSize: '0.65rem',
                                                        fontWeight: 700,
                                                        borderRadius: '2px',
                                                        letterSpacing: '0.05em'
                                                    }}>
                                                        {p.naturalPosition || p.position}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign:'left' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'Satoshi, sans-serif' }}>
                                                            {p.isSuper && <Star weight="fill" color="var(--accent)" size={12} />}
                                                            {p.isWonderkid && <Sparkle weight="fill" color="#C084FC" size={12} />}
                                                            {p.nickname ? `"${p.nickname}" ${p.name.split(' ').pop()}` : p.name}
                                                            {getFormTrendIcon(p.form?.trend)}
                                                            {p.injury && <FirstAid weight="fill" color="var(--danger)" size={14} style={{ marginLeft: '4px' }}/>}
                                                        </div>
                                                        {p.specialty && (
                                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                                {p.specialty}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign:'center', fontWeight: 700, color: '#FFF', ...fontMono }}>
                                                    {p.ovr}
                                                </td>
                                                <td style={{ textAlign:'center' }}>
                                                    {renderHealthBlocks(p.energy)}
                                                </td>
                                                <td style={{ textAlign:'center' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                        {getMoralIcon(p.moral || 50)}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign:'center' }}>
                                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                        {!p.isTitular && !p.injury && p.age <= 23 && (
                                                            <Help id="btn.loan">
                                                                <button onClick={(e) => { e.stopPropagation(); handleLoan(p.id); }} style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--info)', color: 'var(--info)', padding: '4px 6px', cursor: 'pointer', borderRadius: '2px' }}>
                                                                    <PaperPlaneRight size={14} weight="bold" />
                                                                </button>
                                                            </Help>
                                                        )}
                                                        {!p.isTitular && (
                                                            <Help id="btn.sell">
                                                                <button onClick={(e) => { e.stopPropagation(); handleSell(p); }} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '4px 6px', cursor: 'pointer', borderRadius: '2px' }}>
                                                                    <UserMinus size={14} weight="bold" />
                                                                </button>
                                                            </Help>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedId === p.id && (
                                                <tr key={`${p.id}-details`} style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                    <td colSpan="7" style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
                                                        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                                            <div style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                                                                <PentagonChart player={p} size={180} />
                                                            </div>
                                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFF', fontFamily: 'Satoshi, sans-serif' }}>
                                                                    {p.name}
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: "'JetBrains Mono', monospace" }}>
                                                                    <span>IDADE: {p.age}</span>
                                                                    <span>ALTURA: {p.height || '--'}cm</span>
                                                                    <span>PÉ: {p.foot || p.preferredFoot || 'D'}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '16px', marginTop: '8px', ...fontMono }}>
                                                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '4px', borderLeft: '2px solid var(--primary)' }}>
                                                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>OVR/POT</div>
                                                                        <div style={{ fontSize: '1.1rem', color: '#FFF' }}>{p.ovr} / <span style={{ color: p.potential > p.ovr + 5 ? 'var(--primary)' : 'var(--text-muted)' }}>{p.potential || p.ovr}</span></div>
                                                                    </div>
                                                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '4px', borderLeft: '2px solid var(--accent)' }}>
                                                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>VALOR</div>
                                                                        <div style={{ fontSize: '1.1rem', color: 'var(--accent)' }}>R$ {((p.marketValue || p.value) / 1e6).toFixed(1)}M</div>
                                                                    </div>
                                                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '4px', borderLeft: '2px solid var(--info)' }}>
                                                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>RATING POS.</div>
                                                                        <div style={{ fontSize: '1.1rem', color: 'var(--info)' }}>{p.attacking ? calculateRatingForPosition(p, p.naturalPosition || 'MEC') : p.ovr}</div>
                                                                    </div>
                                                                </div>
                                                                {p.personality && (
                                                                    <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(168, 85, 247, 0.1)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#C084FC', fontSize: '0.75rem', fontWeight: 600, width: 'fit-content' }}>
                                                                        <Heartbeat weight="bold" /> PERFIL: {p.personality}
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
                    </div>
                )}

                {tab === 'stats' && (
                    <EfPanel variant="elev" padding="md">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <ChartBar size={24} color="var(--primary)" />
                            <h3 style={{ margin: 0, color: '#FFF' }}>Análise Titulares (Top 11)</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            {sorted.filter(p => p.isTitular).slice(0, 11).map(p => (
                                <div key={p.id} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FFF', fontFamily: 'Satoshi, sans-serif', marginBottom: '4px', textAlign: 'center' }}>{p.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '12px' }}>{p.naturalPosition || p.position}</div>
                                    <PentagonChart player={p} size={160} />
                                </div>
                            ))}
                        </div>
                    </EfPanel>
                )}

                {tab === 'contratos' && (
                    <EfPanel variant="elev" padding="md">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <IdentificationCard size={24} color="var(--accent)" />
                            <h3 style={{ margin: 0, color: '#FFF' }}>Gestão de Contratos</h3>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="ef-table">
                                <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                                    <tr>
                                        <th style={{ textAlign:'left' }}>JOGADOR</th>
                                        <th style={{ textAlign:'center' }}>POS</th>
                                        <th style={{ textAlign:'center' }}>IDADE</th>
                                        <th style={{ textAlign:'right' }}>WAGE/SEM</th>
                                        <th style={{ textAlign:'right' }}>RESTANTE</th>
                                        <th style={{ textAlign:'right' }}>CLÁUSULA</th>
                                        <th style={{ textAlign:'right' }}>VALOR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sorted.map((p, i) => (
                                        <tr key={p.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                                            <td style={{ fontWeight: 600, color: '#FFF' }}>{p.name}</td>
                                            <td style={{ textAlign:'center', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700 }}>{p.naturalPosition || p.position}</td>
                                            <td style={{ textAlign:'center', ...fontMono }}>{p.age}</td>
                                            <td style={{ textAlign:'right', color: 'var(--danger)', ...fontMono }}>R$ {(p.contract?.weeklyWage || 0).toLocaleString('pt-BR')}</td>
                                            <td style={{ textAlign:'right', color: 'var(--text-muted)', ...fontMono }}>{p.contract?.weeksRemaining || p.contract?.weeksLeft || '-'}sem</td>
                                            <td style={{ textAlign:'right', color: 'var(--info)', ...fontMono }}>{p.contract?.releaseClause ? `R$ ${(p.contract.releaseClause / 1e6).toFixed(1)}M` : '-'}</td>
                                            <td style={{ textAlign:'right', color: 'var(--accent)', ...fontMono }}>{p.marketValue ? `R$ ${(p.marketValue / 1e6).toFixed(1)}M` : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </EfPanel>
                )}

                {loanedOut.length > 0 && (
                    <EfPanel variant="warning" padding="md" style={{ marginTop: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <PaperPlaneRight size={20} color="var(--accent)" weight="fill" />
                            <h3 style={{ margin: 0, color: 'var(--accent)' }}>Jogadores Emprestados ({loanedOut.length})</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                            {loanedOut.map((l, i) => (
                                <div key={i} style={{ background: 'var(--bg-panel)', padding: '12px', border: '1px solid rgba(255,214,0,0.2)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 600, color: '#FFF', fontSize: '0.85rem' }}>
                                        {l.playerName} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>→ {l.destination}</span>
                                    </div>
                                    <div style={{ ...fontMono, color: 'var(--accent)', fontSize: '0.8rem' }}>
                                        {l.weeksLeft}/{l.totalWeeks}sem
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
