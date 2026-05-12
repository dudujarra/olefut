import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
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

    const renderHealthBlocks = (energy) => {
        const blocks = [];
        for (let i = 0; i < 5; i++) {
            const threshold = (i + 1) * 20;
            let color = '#2D3748';
            if (energy >= threshold || energy > threshold - 10) {
                color = energy > 60 ? '#39FF14' : energy > 30 ? '#FFD700' : '#FF3333';
            }
            blocks.push(
                <div key={i} className="ef-health-pip" style={{ backgroundColor: color }} />
            );
        }
        return <div className="ef-health-row">{blocks}</div>;
    };

    const getMoralIcon = (m) => {
        if (m > 70) return <ArrowCircleUp weight="fill" color="#39FF14" />;
        if (m > 40) return <MinusCircle weight="fill" color="#8E9E94" />;
        return <ArrowCircleDown weight="fill" color="#FF3333" />;
    };

    const getFormTrendIcon = (trend) => {
        if (trend === 'up') return <ArrowCircleUp size={14} weight="fill" color="#39FF14" />;
        if (trend === 'down') return <ArrowCircleDown size={14} weight="fill" color="#FF3333" />;
        return null;
    };

    const getPosColor = (pos) => {
        if (pos === 'GOL') return '#FFD700';
        if (pos === 'DEF') return '#40BAF7';
        if (pos === 'MEI') return '#39FF14';
        if (pos === 'ATA') return '#FF3333';
        return '#8E9E94';
    };

    return (
        <div className="ef-view-shell ef-view-shell--fixed">
            <div className="ef-view-container ef-view-container--wide">

                {/* === HEADER — LUXURY BENTO === */}
                <EfPanel variant="hero" padding="lg" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <EfClubBadge name={team.name} size="lg" />
                        <div>
                            <div className="ef-tag-mono" style={{ marginBottom: '12px' }}>
                                <Users weight="fill" /> {sorted.length}/{team.squad.length} JOGADORES NO PLANTEL
                            </div>
                            <h2 className="ef-heading-xl">
                                {team.name}
                            </h2>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            <EfButton variant="secondary" size="md" onClick={() => changeView(back)} className="ef-sans" style={{ fontWeight: 'bold' }}>VOLTAR</EfButton>
                            <EfButton variant="primary" size="md" title="Carrega o plantel real do clube via dataset pre-bake (substitui jogadores gerados)" onClick={handleLoadRealSquad} disabled={loadingReal} className="ef-sans" style={{ fontWeight: 'bold' }}>
                                {loadingReal ? 'CARREGANDO...' : 'PLANTEL REAL'}
                            </EfButton>
                        </div>
                        {team.manager && team.manager.name && (
                            <div className="ef-tag-mono ef-tag-mono--info">
                                <User weight="fill" /> TREINADOR: {team.manager.name.toUpperCase()}
                            </div>
                        )}
                        {team.manager?.stats && (
                            <div className="ef-mono ef-text-muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                                {team.manager.stats.wins || 0}V <span className="ef-text-accent">{team.manager.stats.draws || 0}E</span> <span className="ef-text-danger">{team.manager.stats.losses || 0}D</span>
                            </div>
                        )}
                    </div>
                </EfPanel>

                {/* Tabs & Filters Bento */}
                <EfPanel padding="md" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: '#161B22' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {[
                            { id: 'plantel', label: 'PLANTEL', icon: <Users size={16} /> },
                            { id: 'stats', label: 'ANÁLISE TÁTICA', icon: <ChartBar size={16} /> },
                            { id: 'contratos', label: 'FINANÇAS', icon: <IdentificationCard size={16} /> }
                        ].map(t => (
                            <EfButton key={t.id} onClick={() => setTab(t.id)} variant={tab === t.id ? 'primary' : 'secondary'} size="md" className="ef-sans" style={{ fontWeight: 'bold', gap: '8px' }}>
                                {t.icon} {t.label}
                            </EfButton>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
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
                    <EfPanel padding="none" style={{ overflowX: 'auto', background: '#161B22', border: '1px solid #1A1F24' }}>
                        <table className="ef-sans" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#1A1F24', borderBottom: '2px solid #2D3748' }}>
                                <tr>
                                    <th className="ef-text-muted" style={{ textAlign:'center', width: '60px', padding: '16px', fontSize: '0.75rem', fontWeight: 'bold' }}>ST</th>
                                    <th onClick={() => handleSort('position')} className={sortBy === 'position' ? 'ef-text-primary' : 'ef-text-muted'} style={{ textAlign:'center', width: '70px', padding: '16px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>POS</th>
                                    <th onClick={() => handleSort('name')} className={sortBy === 'name' ? 'ef-text-primary' : 'ef-text-muted'} style={{ textAlign:'left', padding: '16px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>JOGADOR</th>
                                    <th onClick={() => handleSort('ovr')} className={sortBy === 'ovr' ? 'ef-text-primary' : 'ef-text-muted'} style={{ textAlign:'center', width: '70px', padding: '16px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>OVR</th>
                                    <th onClick={() => handleSort('energy')} className={sortBy === 'energy' ? 'ef-text-primary' : 'ef-text-muted'} style={{ textAlign:'center', width: '120px', padding: '16px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>COND</th>
                                    <th onClick={() => handleSort('moral')} className={sortBy === 'moral' ? 'ef-text-primary' : 'ef-text-muted'} style={{ textAlign:'center', width: '80px', padding: '16px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>MOR</th>
                                    <th className="ef-text-muted" style={{ textAlign:'center', width: '100px', padding: '16px', fontSize: '0.75rem', fontWeight: 'bold' }}>AÇÃO</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((p, index) => {
                                    const isSelected = p.isTitular;
                                    return (
                                        <React.Fragment key={p.id}>
                                            <tr 
                                                style={{
                                                    background: index % 2 === 0 ? '#161B22' : '#1A1F24',
                                                    opacity: p.injury ? 0.6 : 1,
                                                    cursor: 'pointer',
                                                    borderLeft: isSelected ? '4px solid #39FF14' : '4px solid transparent',
                                                    borderBottom: '1px solid #1A1F24'
                                                }}
                                                onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                                            >
                                                <td style={{ textAlign:'center', padding: '12px' }}>
                                                    <div
                                                        onClick={(e) => { e.stopPropagation(); toggleTitular(p.id); }}
                                                        className={`ef-st-toggle${isSelected ? ' ef-st-toggle--active' : ''}${p.injury ? ' ef-st-toggle--disabled' : ''}`}
                                                        title={p.injury ? 'Lesionado — fora da escalação até recuperar' : 'Alternar Titular/Reserva (titular ganha XP em jogo; reserva acumula desmotivação se não for usado)'}
                                                    >
                                                        {isSelected && <CheckCircle weight="bold" color="#39FF14" size={16} />}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign:'center', padding: '12px' }}>
                                                    <span className="ef-mono" style={{
                                                        color: '#0D1117',
                                                        background: getPosColor(p.position),
                                                        padding: '4px 8px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700
                                                    }}>
                                                        {p.naturalPosition || p.position}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign:'left', padding: '12px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <div className="ef-text-main" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                            {p.isSuper && <Star weight="fill" color="#FFD700" size={14} />}
                                                            {p.isWonderkid && <Sparkle weight="fill" color="#C084FC" size={14} />}
                                                            {p.nickname ? `"${p.nickname}" ${p.name.split(' ').pop()}` : p.name}
                                                            {getFormTrendIcon(p.form?.trend)}
                                                            {p.injury && <FirstAid weight="fill" color="#FF3333" size={16} style={{ marginLeft: '4px' }}/>}
                                                        </div>
                                                        {p.specialty && (
                                                            <div className="ef-mono ef-text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                                                                {p.specialty}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="ef-mono ef-text-main" style={{ textAlign:'center', fontWeight: 'bold', fontSize: '1.1rem', padding: '12px' }}>
                                                    {p.ovr}
                                                </td>
                                                <td style={{ textAlign:'center', padding: '12px' }}>
                                                    {renderHealthBlocks(p.energy)}
                                                </td>
                                                <td style={{ textAlign:'center', padding: '12px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                        {getMoralIcon(p.moral || 50)}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign:'center', padding: '12px' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
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
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedId === p.id && (
                                                <tr key={`${p.id}-details`} style={{ background: '#0D1117' }}>
                                                    <td colSpan="7" style={{ padding: '24px', borderBottom: '1px solid #2D3748' }}>
                                                        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                                                            <div style={{ background: '#1A1F24', padding: '16px', border: '1px solid #2D3748' }}>
                                                                <HexagonChart player={p} size={180} />
                                                            </div>
                                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                                                                    <div style={{ background: '#1A1F24', padding: '12px 16px', borderLeft: '3px solid #39FF14' }}>
                                                                        <div className="ef-text-muted" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>OVR / POT</div>
                                                                        <div className="ef-text-main" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{p.ovr} <span style={{ color: '#4A5059', fontSize: '1rem', fontWeight: 'normal' }}>/</span> <span className={p.potential > p.ovr + 5 ? 'ef-text-primary' : 'ef-text-muted'}>{p.potential || p.ovr}</span></div>
                                                                    </div>
                                                                    <div style={{ background: '#1A1F24', padding: '12px 16px', borderLeft: '3px solid #FFD700' }}>
                                                                        <div className="ef-text-muted" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>VALOR DE MERCADO</div>
                                                                        <div className="ef-text-accent" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>R$ {((p.marketValue || p.value) / 1e6).toFixed(1)}M</div>
                                                                    </div>
                                                                    <div style={{ background: '#1A1F24', padding: '12px 16px', borderLeft: '3px solid #40BAF7' }}>
                                                                        <div className="ef-text-muted" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>RATING (POS)</div>
                                                                        <div className="ef-text-info" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{p.attacking ? calculateRatingForPosition(p, p.naturalPosition || 'MEC') : p.ovr}</div>
                                                                    </div>
                                                                </div>
                                                                {p.personality && (
                                                                    <div className="ef-sans" style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#2D162D', padding: '6px 12px', border: '1px solid #C084FC', color: '#C084FC', fontSize: '0.8rem', fontWeight: 'bold' }}>
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

                {tab === 'stats' && (
                    <EfPanel padding="md">
                        <div className="ef-section-header" style={{ marginBottom: '24px' }}>
                            <ChartBar size={24} color="#39FF14" weight="fill" />
                            <h3>ANÁLISE TITULARES (TOP 11)</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                            {sorted.filter(p => p.isTitular).slice(0, 11).map(p => (
                                <div key={p.id} style={{ background: '#1A1F24', border: '1px solid #2D3748', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div className="ef-sans ef-text-main" style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '8px', textAlign: 'center' }}>{p.name}</div>
                                    <div className="ef-mono" style={{ fontSize: '0.8rem', color: getPosColor(p.position), fontWeight: 'bold', marginBottom: '16px', background: '#0D1117', padding: '4px 12px' }}>{p.naturalPosition || p.position}</div>
                                    <HexagonChart player={p} size={160} />
                                </div>
                            ))}
                        </div>
                    </EfPanel>
                )}

                {tab === 'contratos' && (
                    <EfPanel padding="none" style={{ overflowX: 'auto', background: '#161B22', border: '1px solid #1A1F24' }}>
                        <div className="ef-section-header" style={{ padding: '24px', marginBottom: 0, borderBottom: '2px solid #2D3748' }}>
                            <IdentificationCard size={24} color="#FFD700" weight="fill" />
                            <h3>GESTÃO DE CONTRATOS</h3>
                        </div>
                        <table className="ef-sans" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#1A1F24', borderBottom: '2px solid #2D3748' }}>
                                <tr>
                                    <th className="ef-text-muted" style={{ textAlign:'left', padding: '16px', fontSize: '0.75rem', fontWeight: 'bold' }}>JOGADOR</th>
                                    <th className="ef-text-muted" style={{ textAlign:'center', padding: '16px', fontSize: '0.75rem', fontWeight: 'bold' }}>POS</th>
                                    <th className="ef-text-muted" style={{ textAlign:'center', padding: '16px', fontSize: '0.75rem', fontWeight: 'bold' }}>IDADE</th>
                                    <th className="ef-text-muted" style={{ textAlign:'right', padding: '16px', fontSize: '0.75rem', fontWeight: 'bold' }}>WAGE/SEM</th>
                                    <th className="ef-text-muted" style={{ textAlign:'right', padding: '16px', fontSize: '0.75rem', fontWeight: 'bold' }}>RESTANTE</th>
                                    <th className="ef-text-muted" style={{ textAlign:'right', padding: '16px', fontSize: '0.75rem', fontWeight: 'bold' }}>CLÁUSULA</th>
                                    <th className="ef-text-muted" style={{ textAlign:'right', padding: '16px', fontSize: '0.75rem', fontWeight: 'bold' }}>VALOR</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((p, i) => (
                                    <tr key={p.id} style={{ background: i % 2 === 0 ? '#161B22' : '#1A1F24', borderBottom: '1px solid #1A1F24' }}>
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
                    <EfPanel padding="md" style={{ background: '#2D2916', borderColor: '#FFD700' }}>
                        <div className="ef-section-header" style={{ color: '#FFD700' }}>
                            <PaperPlaneRight size={24} color="#FFD700" weight="fill" />
                            <h3 style={{ color: '#FFD700' }}>JOGADORES EMPRESTADOS ({loanedOut.length})</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                            {loanedOut.map((l, i) => (
                                <div key={i} style={{ background: '#1A1F24', padding: '16px', border: '1px solid #4A5059', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="ef-sans ef-text-main" style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                        {l.playerName} <span className="ef-text-muted" style={{ fontWeight: 'normal', display: 'block', marginTop: '4px', fontSize: '0.8rem' }}>→ {l.destination}</span>
                                    </div>
                                    <div className="ef-mono ef-text-accent" style={{ fontSize: '0.85rem', background: '#0D1117', padding: '6px 12px' }}>
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
