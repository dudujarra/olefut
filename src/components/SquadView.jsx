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
                <div key={i} style={{ width: '8px', height: '14px', backgroundColor: color, }} />
            );
        }
        return <div style={{ display: 'flex', gap: '3px', alignItems: 'center', justifyContent: 'center' }}>{blocks}</div>;
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
        <div style={{ padding: '24px', width: '100%', height: '100%', overflowY: 'auto', backgroundColor: '#0D1117' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* === HEADER — LUXURY BENTO === */}
                <EfPanel variant="hero" padding="lg" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <EfClubBadge name={team.name} size="lg" />
                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#1A1F24', color: '#8E9E94', padding: '4px 12px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', marginBottom: '12px' }}>
                                <Users weight="fill" /> {sorted.length}/{team.squad.length} JOGADORES NO PLANTEL
                            </div>
                            <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '2rem', fontWeight: '800', margin: '0 0 8px 0', color: '#FDFBF7' }}>
                                {team.name}
                            </h2>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            <EfButton variant="secondary" size="md" onClick={() => changeView(back)} style={{ fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>VOLTAR</EfButton>
                            <EfButton variant="primary" size="md" title="Carrega o plantel real do clube via dataset pre-bake (substitui jogadores gerados)" onClick={handleLoadRealSquad} disabled={loadingReal} style={{ fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>
                                {loadingReal ? 'CARREGANDO...' : 'PLANTEL REAL'}
                            </EfButton>
                        </div>
                        {team.manager && team.manager.name && (
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#40BAF7', background: '#16242D', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <User weight="fill" /> TREINADOR: {team.manager.name.toUpperCase()}
                            </div>
                        )}
                        {team.manager?.stats && (
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#8E9E94', marginTop: '4px' }}>
                                {team.manager.stats.wins || 0}V <span style={{color:'#FFD700'}}>{team.manager.stats.draws || 0}E</span> <span style={{color:'#FF3333'}}>{team.manager.stats.losses || 0}D</span>
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
                            <EfButton key={t.id} onClick={() => setTab(t.id)} variant={tab === t.id ? 'primary' : 'secondary'} size="md" style={{ fontFamily: 'var(--font-sans)', fontWeight: 'bold', gap: '8px' }}>
                                {t.icon} {t.label}
                            </EfButton>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ position: 'relative' }}>
                            <MagnifyingGlass size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8E9E94' }} />
                            <input type="text" placeholder="Buscar jogador..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '8px 12px 8px 36px', background: '#1A1F24', border: '1px solid #2D3748', color: '#FDFBF7', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', outline: 'none', width: '200px' }} />
                        </div>
                        <select value={filterPos} onChange={(e) => setFilterPos(e.target.value)} style={{ padding: '8px 12px', background: '#1A1F24', border: '1px solid #2D3748', color: '#FDFBF7', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', outline: 'none' }}>
                            <option value="all">Todas as posições</option>
                            <option value="GOL">GOL</option>
                            <option value="DEF">DEF</option>
                            <option value="MEI">MEI</option>
                            <option value="ATA">ATA</option>
                        </select>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '8px 12px', background: '#1A1F24', border: '1px solid #2D3748', color: '#FDFBF7', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', outline: 'none' }}>
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
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)' }}>
                            <thead style={{ background: '#1A1F24', borderBottom: '2px solid #2D3748' }}>
                                <tr>
                                    <th style={{ textAlign:'center', width: '60px', padding: '16px', color: '#8E9E94', fontSize: '0.75rem', fontWeight: 'bold' }}>ST</th>
                                    <th onClick={() => handleSort('position')} style={{ textAlign:'center', width: '70px', padding: '16px', color: sortBy === 'position' ? '#39FF14' : '#8E9E94', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>POS</th>
                                    <th onClick={() => handleSort('name')} style={{ textAlign:'left', padding: '16px', color: sortBy === 'name' ? '#39FF14' : '#8E9E94', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>JOGADOR</th>
                                    <th onClick={() => handleSort('ovr')} style={{ textAlign:'center', width: '70px', padding: '16px', color: sortBy === 'ovr' ? '#39FF14' : '#8E9E94', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>OVR</th>
                                    <th onClick={() => handleSort('energy')} style={{ textAlign:'center', width: '120px', padding: '16px', color: sortBy === 'energy' ? '#39FF14' : '#8E9E94', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>COND</th>
                                    <th onClick={() => handleSort('moral')} style={{ textAlign:'center', width: '80px', padding: '16px', color: sortBy === 'moral' ? '#39FF14' : '#8E9E94', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>MOR</th>
                                    <th style={{ textAlign:'center', width: '100px', padding: '16px', color: '#8E9E94', fontSize: '0.75rem', fontWeight: 'bold' }}>AÇÃO</th>
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
                                                        style={{
                                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                            width: '24px', height: '24px',
                                                            background: isSelected ? '#162D1C' : '#2D3748',
                                                            border: `1px solid ${isSelected ? '#39FF14' : '#4A5059'}`,
                                                            cursor: p.injury ? 'not-allowed' : 'pointer'
                                                        }}
                                                        title={p.injury ? 'Lesionado — fora da escalação até recuperar' : 'Alternar Titular/Reserva (titular ganha XP em jogo; reserva acumula desmotivação se não for usado)'}
                                                    >
                                                        {isSelected && <CheckCircle weight="bold" color="#39FF14" size={16} />}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign:'center', padding: '12px' }}>
                                                    <span style={{
                                                        color: '#0D1117',
                                                        background: getPosColor(p.position),
                                                        padding: '4px 8px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700,
                                                        fontFamily: 'var(--font-mono)'
                                                    }}>
                                                        {p.naturalPosition || p.position}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign:'left', padding: '12px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#FDFBF7', fontSize: '0.9rem' }}>
                                                            {p.isSuper && <Star weight="fill" color="#FFD700" size={14} />}
                                                            {p.isWonderkid && <Sparkle weight="fill" color="#C084FC" size={14} />}
                                                            {p.nickname ? `"${p.nickname}" ${p.name.split(' ').pop()}` : p.name}
                                                            {getFormTrendIcon(p.form?.trend)}
                                                            {p.injury && <FirstAid weight="fill" color="#FF3333" size={16} style={{ marginLeft: '4px' }}/>}
                                                        </div>
                                                        {p.specialty && (
                                                            <div style={{ fontSize: '0.7rem', color: '#8E9E94', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                                                {p.specialty}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign:'center', fontWeight: 'bold', color: '#FDFBF7', fontFamily: 'var(--font-mono)', fontSize: '1.1rem', padding: '12px' }}>
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
                                                            <button title="Emprestar (jovem ganha minutos em outro clube; volta com XP)" onClick={(e) => { e.stopPropagation(); handleLoan(p.id); }} style={{ background: '#16242D', border: '1px solid #40BAF7', color: '#40BAF7', padding: '6px 8px', cursor: 'pointer', }}>
                                                                <PaperPlaneRight size={16} weight="bold" />
                                                            </button>
                                                        )}
                                                        {!p.isTitular && (
                                                            <button title="Vender jogador direto (sem negociação, valor de mercado fixo)" onClick={(e) => { e.stopPropagation(); handleSell(p); }} style={{ background: '#2D1616', border: '1px solid #FF3333', color: '#FF3333', padding: '6px 8px', cursor: 'pointer', }}>
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
                                                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FDFBF7', fontFamily: 'var(--font-sans)' }}>
                                                                    {p.name}
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '16px', color: '#8E9E94', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                                                                    {p.personality && (
                                                                        <div style={{ color: 'var(--text-muted)' }}>
                                                                            <Heartbeat weight="fill" /> {p.personality} • {p.playstyle || 'Caneleiro'}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '24px', marginTop: '12px', fontFamily: 'var(--font-mono)' }}>
                                                                    <div style={{ background: '#1A1F24', padding: '12px 16px', borderLeft: '3px solid #39FF14' }}>
                                                                        <div style={{ fontSize: '0.7rem', color: '#8E9E94', marginBottom: '4px' }}>OVR / POT</div>
                                                                        <div style={{ fontSize: '1.2rem', color: '#FDFBF7', fontWeight: 'bold' }}>{p.ovr} <span style={{ color: '#4A5059', fontSize: '1rem', fontWeight: 'normal' }}>/</span> <span style={{ color: p.potential > p.ovr + 5 ? '#39FF14' : '#8E9E94' }}>{p.potential || p.ovr}</span></div>
                                                                    </div>
                                                                    <div style={{ background: '#1A1F24', padding: '12px 16px', borderLeft: '3px solid #FFD700' }}>
                                                                        <div style={{ fontSize: '0.7rem', color: '#8E9E94', marginBottom: '4px' }}>VALOR DE MERCADO</div>
                                                                        <div style={{ fontSize: '1.2rem', color: '#FFD700', fontWeight: 'bold' }}>R$ {((p.marketValue || p.value) / 1e6).toFixed(1)}M</div>
                                                                    </div>
                                                                    <div style={{ background: '#1A1F24', padding: '12px 16px', borderLeft: '3px solid #40BAF7' }}>
                                                                        <div style={{ fontSize: '0.7rem', color: '#8E9E94', marginBottom: '4px' }}>RATING (POS)</div>
                                                                        <div style={{ fontSize: '1.2rem', color: '#40BAF7', fontWeight: 'bold' }}>{p.attacking ? calculateRatingForPosition(p, p.naturalPosition || 'MEC') : p.ovr}</div>
                                                                    </div>
                                                                </div>
                                                                {p.personality && (
                                                                    <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#2D162D', padding: '6px 12px', border: '1px solid #C084FC', color: '#C084FC', fontSize: '0.8rem', fontWeight: 'bold', fontFamily: 'var(--font-sans)' }}>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontFamily: 'var(--font-sans)', color: '#FDFBF7' }}>
                            <ChartBar size={24} color="#39FF14" weight="fill" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>ANÁLISE TITULARES (TOP 11)</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                            {sorted.filter(p => p.isTitular).slice(0, 11).map(p => (
                                <div key={p.id} style={{ background: '#1A1F24', border: '1px solid #2D3748', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#FDFBF7', fontFamily: 'var(--font-sans)', marginBottom: '8px', textAlign: 'center' }}>{p.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: getPosColor(p.position), fontWeight: 'bold', fontFamily: 'var(--font-mono)', marginBottom: '16px', background: '#0D1117', padding: '4px 12px', }}>{p.naturalPosition || p.position}</div>
                                    <HexagonChart player={p} size={160} />
                                </div>
                            ))}
                        </div>
                    </EfPanel>
                )}

                {tab === 'contratos' && (
                    <EfPanel padding="none" style={{ overflowX: 'auto', background: '#161B22', border: '1px solid #1A1F24' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '24px', borderBottom: '2px solid #2D3748', fontFamily: 'var(--font-sans)', color: '#FDFBF7' }}>
                            <IdentificationCard size={24} color="#FFD700" weight="fill" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>GESTÃO DE CONTRATOS</h3>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)' }}>
                            <thead style={{ background: '#1A1F24', borderBottom: '2px solid #2D3748' }}>
                                <tr>
                                    <th style={{ textAlign:'left', padding: '16px', color: '#8E9E94', fontSize: '0.75rem', fontWeight: 'bold' }}>JOGADOR</th>
                                    <th style={{ textAlign:'center', padding: '16px', color: '#8E9E94', fontSize: '0.75rem', fontWeight: 'bold' }}>POS</th>
                                    <th style={{ textAlign:'center', padding: '16px', color: '#8E9E94', fontSize: '0.75rem', fontWeight: 'bold' }}>IDADE</th>
                                    <th style={{ textAlign:'right', padding: '16px', color: '#8E9E94', fontSize: '0.75rem', fontWeight: 'bold' }}>WAGE/SEM</th>
                                    <th style={{ textAlign:'right', padding: '16px', color: '#8E9E94', fontSize: '0.75rem', fontWeight: 'bold' }}>RESTANTE</th>
                                    <th style={{ textAlign:'right', padding: '16px', color: '#8E9E94', fontSize: '0.75rem', fontWeight: 'bold' }}>CLÁUSULA</th>
                                    <th style={{ textAlign:'right', padding: '16px', color: '#8E9E94', fontSize: '0.75rem', fontWeight: 'bold' }}>VALOR</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((p, i) => (
                                    <tr key={p.id} style={{ background: i % 2 === 0 ? '#161B22' : '#1A1F24', borderBottom: '1px solid #1A1F24' }}>
                                        <td style={{ fontWeight: 'bold', color: '#FDFBF7', padding: '16px' }}>{p.name}</td>
                                        <td style={{ textAlign:'center', color: getPosColor(p.position), fontSize: '0.8rem', fontWeight: 'bold', padding: '16px', fontFamily: 'var(--font-mono)' }}>{p.naturalPosition || p.position}</td>
                                        <td style={{ textAlign:'center', fontFamily: 'var(--font-mono)', color: '#8E9E94', padding: '16px' }}>{p.age}</td>
                                        <td style={{ textAlign:'right', color: '#FF3333', fontFamily: 'var(--font-mono)', padding: '16px' }}>R$ {(p.contract?.weeklyWage || 0).toLocaleString('pt-BR')}</td>
                                        <td style={{ textAlign:'right', color: '#8E9E94', fontFamily: 'var(--font-mono)', padding: '16px' }}>{p.contract?.weeksRemaining || p.contract?.weeksLeft || '-'} sem</td>
                                        <td style={{ textAlign:'right', color: '#40BAF7', fontFamily: 'var(--font-mono)', padding: '16px' }}>{p.contract?.releaseClause ? `R$ ${(p.contract.releaseClause / 1e6).toFixed(1)}M` : '-'}</td>
                                        <td style={{ textAlign:'right', color: '#FFD700', fontFamily: 'var(--font-mono)', padding: '16px' }}>{p.marketValue ? `R$ ${(p.marketValue / 1e6).toFixed(1)}M` : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </EfPanel>
                )}

                {loanedOut.length > 0 && (
                    <EfPanel padding="md" style={{ background: '#2D2916', borderColor: '#FFD700' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontFamily: 'var(--font-sans)' }}>
                            <PaperPlaneRight size={24} color="#FFD700" weight="fill" />
                            <h3 style={{ margin: 0, color: '#FFD700', fontSize: '1.1rem' }}>JOGADORES EMPRESTADOS ({loanedOut.length})</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                            {loanedOut.map((l, i) => (
                                <div key={i} style={{ background: '#1A1F24', padding: '16px', border: '1px solid #4A5059', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 'bold', color: '#FDFBF7', fontSize: '0.9rem', fontFamily: 'var(--font-sans)' }}>
                                        {l.playerName} <span style={{ color: '#8E9E94', fontWeight: 'normal', display: 'block', marginTop: '4px', fontSize: '0.8rem' }}>→ {l.destination}</span>
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-mono)', color: '#FFD700', fontSize: '0.85rem', background: '#0D1117', padding: '6px 12px', }}>
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
