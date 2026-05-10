import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { getFormEmoji } from '../engine/PlayerDevelopment';
import { getPlayerTraits } from '../engine/PlayerTraits';
import { PlayerAvatar } from '../utils/avatar';
import { Help } from './Help';
import { Tooltip } from './Tooltip';
import { EfClubBadge } from './ui/EfClubBadge';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';
import { PentagonChart } from './PentagonChart';
import { POSITIONS, getMacroPosition, calculateRatingForPosition, calculateEffectiveRating } from '../engine/Positions';
import { injectSquadIntoTeam } from '../services/SquadDataService';
import bgPitch from '../assets/environments/bg_tactics_pitch.png';

export function SquadView() {
    const { gameState, changeView, getEngine, forceUpdate } = useGame();
    const engine = getEngine();
    const team = engine.getTeam(gameState.teamId);

    // P1-8: filter/sort + P1-9: search
    const [filterPos, setFilterPos] = useState('all');
    const [sortBy, setSortBy] = useState('position');
    const [search, setSearch] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [loadingReal, setLoadingReal] = useState(false);
    const [tab, setTab] = useState('plantel'); // plantel | stats | contratos

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

    const handleSort = (key) => {
        setSortBy(key);
    };

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
        const result = engine.sellPlayer(player.id, price);
        forceUpdate();
    };

    const getEnergyColor = (e) => e > 60 ? '#39FF14' : e > 30 ? '#FFD700' : '#FF3333';
    const getMoralEmoji = (m) => m > 70 ? '😊' : m > 40 ? '😐' : '😞';

    const back = gameState.mode === 'player' ? 'player_dashboard' : 'dashboard';

    // Loaned out players
    const loanedOut = engine.loanedOut || [];

    const renderHealthBars = (energy) => {
        const blocks = [];
        for (let i = 0; i < 5; i++) {
            const threshold = (i + 1) * 20;
            let color = '#222'; // empty
            if (energy >= threshold || energy > threshold - 10) {
                color = energy > 60 ? '#39FF14' : energy > 30 ? '#FFD700' : '#FF3333';
            }
            blocks.push(<div key={i} style={{width:'8px', height:'12px', backgroundColor: color, border:'1px solid #000', boxShadow:'inset 1px 1px 0 rgba(255,255,255,0.3)'}} />);
        }
        return <div style={{display:'flex', gap:'2px', alignItems: 'center'}}>{blocks}</div>;
    };

    return (
        <div className="ef-anim-fade-in" style={{
            backgroundImage: `url(${bgPitch})`,
            imageRendering: 'pixelated',
            WebkitImageRendering: 'pixelated',
            backgroundColor: '#0A130E',
            backgroundSize: 'cover',
            backgroundPosition: 'center 20%',
            backgroundAttachment: 'fixed',
            minHeight: '100dvh',
            padding: '16px',
            color: '#E2E8F0'
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <EfPanel variant="elev" padding="md" style={{ display:'flex', alignItems:'center', gap:'12px', flexWrap: 'wrap' }}>
                <EfClubBadge name={team.name} size="md" />
                <h2 style={{margin:0,flex:1, fontSize: '1.2rem'}}>👥 PLANTEL — {team.name} ({sorted.length}/{team.squad.length})</h2>
                <EfButton variant="secondary" size="sm" onClick={() => changeView(back)}>← Voltar</EfButton>
                <EfButton
                    variant="primary" size="sm"
                    onClick={handleLoadRealSquad}
                    disabled={loadingReal}
                    title="Carregar plantel real do SofaScore (se disponível)"
                >
                    {loadingReal ? '⏳ Carregando...' : '🌐 Plantel Real'}
                </EfButton>
            </EfPanel>

            {/* Manager card */}
            {team.manager && team.manager.name && (
                <EfPanel variant="sunk" padding="md" style={{
                    background: '#1F1A10',
                    border: '1px solid #F7B538'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '2rem' }}>👔</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                                {team.manager.name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#888' }}>
                                Treinador {team.manager.country ? `• ${team.manager.country}` : ''}
                                {team.manager.preferredFormation ? ` • Formação: ${team.manager.preferredFormation}` : ''}
                            </div>
                        </div>
                        {team.manager.stats && (
                            <div style={{ fontSize: '0.75rem', textAlign: 'right' }}>
                                <div>📊 {team.manager.stats.total || 0} jogos</div>
                                <div style={{ color: '#39FF14' }}>{team.manager.stats.wins || 0}V</div>
                                <div style={{ color: '#FFD700' }}>{team.manager.stats.draws || 0}E</div>
                                <div style={{ color: '#FF3333' }}>{team.manager.stats.losses || 0}D</div>
                            </div>
                        )}
                    </div>
                </EfPanel>
            )}

            {/* SPEC-080 Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
                {[
                    { id: 'plantel', label: '👥 PLANTEL' },
                    { id: 'stats', label: '📊 STATS' },
                    { id: 'contratos', label: '📝 CONTRATOS' }
                ].map(t => (
                    <EfButton
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        variant={tab === t.id ? 'primary' : 'secondary'}
                        size="sm"
                        style={{ justifyContent: 'center' }}
                    >{t.label}</EfButton>
                ))}
            </div>

            {/* P1-8/9: filter + sort + search */}
            <EfPanel variant="sunk" padding="sm" style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
                <input
                    type="text"
                    placeholder="🔍 BUSCAR JOGADOR..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{flex:'1 1 200px',padding:'8px 12px',background:'rgba(0,0,0,0.5)',border:'4px solid #111417',color:'#E2E8F0',fontSize:'0.85rem', outline:'none', fontWeight: 600}}
                />
                <select value={filterPos} onChange={(e) => setFilterPos(e.target.value)} style={{padding:'8px 12px',background:'#0A130E',border:'4px solid #111417',color:'#E2E8F0',fontSize:'0.85rem', outline:'none', fontWeight: 600}}>
                    <option value="all">Todas posições</option>
                    <option value="GOL">GOL</option>
                    <option value="DEF">DEF</option>
                    <option value="MEI">MEI</option>
                    <option value="ATA">ATA</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{padding:'8px 12px',background:'#0A130E',border:'4px solid #111417',color:'#E2E8F0',fontSize:'0.85rem', outline:'none', fontWeight: 600}}>
                    <option value="position">Ordenar: Posição</option>
                    <option value="ovr">Ordenar: OVR ↓</option>
                    <option value="age">Ordenar: Idade ↑</option>
                    <option value="energy">Ordenar: Energia ↓</option>
                    <option value="name">Ordenar: Nome A-Z</option>
                </select>
            </EfPanel>

            {tab === 'plantel' && (
            <div style={{
                backgroundColor: '#1E2124',
                border: '4px solid',
                borderColor: '#4A5059 #111417 #111417 #4A5059',
                boxShadow: '0 16px 0 rgba(0,0,0,0.5)',
                padding: '12px',
                overflowX: 'auto',
                marginBottom: '24px'
            }}>
                <div style={{
                    fontFamily: "'Press Start 2P', monospace",
                    color: '#FFF',
                    textAlign: 'center',
                    marginBottom: '16px',
                    fontSize: '1.2rem',
                    textShadow: '2px 2px 0 #000'
                }}>
                    SQUAD LIST
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '0.75rem', fontFamily: "'Press Start 2P', monospace" }}>
                    <thead>
                        <tr style={{ borderBottom: '4px solid #4A5059', color: '#888' }}>
                            <th style={{padding:'12px 8px', textAlign:'center'}}>ST</th>
                            <th 
                                onClick={() => handleSort('position')}
                                style={{padding:'12px 8px', textAlign:'center', cursor: 'pointer', color: sortBy === 'position' ? '#FFD700' : '#888'}}
                            >
                                POS {sortBy === 'position' ? '▼' : ''}
                            </th>
                            <th 
                                onClick={() => handleSort('name')}
                                style={{padding:'12px 8px', textAlign:'left', cursor: 'pointer', color: sortBy === 'name' ? '#FFD700' : '#888'}}
                            >
                                PLAYER {sortBy === 'name' ? '▼' : ''}
                            </th>
                            <th 
                                onClick={() => handleSort('ovr')}
                                style={{padding:'12px 8px', textAlign:'center', cursor: 'pointer', color: sortBy === 'ovr' ? '#FFD700' : '#888'}}
                            >
                                FIT {sortBy === 'ovr' ? '▼' : ''}
                            </th>
                            <th 
                                onClick={() => handleSort('energy')}
                                style={{padding:'12px 8px', textAlign:'center', cursor: 'pointer', color: sortBy === 'energy' ? '#FFD700' : '#888'}}
                            >
                                COND {sortBy === 'energy' ? '▼' : ''}
                            </th>
                            <th 
                                onClick={() => handleSort('moral')}
                                style={{padding:'12px 8px', textAlign:'center', cursor: 'pointer', color: sortBy === 'moral' ? '#FFD700' : '#888'}}
                            >
                                MOR {sortBy === 'moral' ? '▼' : ''}
                            </th>
                            <th style={{padding:'12px 8px', textAlign:'center'}}>ACT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((p, index) => {
                            const isSelected = p.isTitular;
                            return (
                                <React.Fragment key={p.id}>
                                    <tr 
                                        style={{
                                            backgroundColor: index % 2 === 0 ? '#111417' : '#181A1F',
                                            border: isSelected ? '2px solid #FFD700' : '2px solid transparent',
                                            opacity: p.injury ? 0.6 : 1,
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                                    >
                                        <td style={{padding:'8px', textAlign:'center'}}>
                                            <div
                                                onClick={(e) => { e.stopPropagation(); toggleTitular(p.id); }}
                                                style={{
                                                    display: 'inline-block',
                                                    width: '16px',
                                                    height: '16px',
                                                    backgroundColor: isSelected ? '#39FF14' : '#222',
                                                    border: '2px solid #000',
                                                    boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.3)',
                                                    cursor: p.injury ? 'not-allowed' : 'pointer'
                                                }}
                                                title={p.injury ? 'Machucado' : 'Alternar titular'}
                                            />
                                        </td>
                                        <td style={{padding:'8px', textAlign:'center'}}>
                                            <div style={{display:'flex', gap:'4px', justifyContent:'center'}}>
                                                {/* Primary Position (Solid) */}
                                                <span style={{
                                                    color: '#111',
                                                    backgroundColor: p.position === 'GOL' ? '#FFD700' : 
                                                           p.position === 'DEF' ? '#40BAF7' : 
                                                           p.position === 'MEI' ? '#39FF14' : '#FF3333',
                                                    padding: '2px 6px',
                                                    border: '2px solid #000',
                                                    boxShadow: '1px 1px 0 #000'
                                                }}>
                                                    {p.naturalPosition || p.position}
                                                </span>
                                                {/* Sub-Position (Outlined) for Malleability */}
                                                {p.position !== 'GOL' && (
                                                    <span style={{
                                                        color: p.position === 'DEF' ? '#40BAF7' : 
                                                               p.position === 'MEI' ? '#39FF14' : '#FF3333',
                                                        backgroundColor: 'transparent',
                                                        padding: '2px 6px',
                                                        border: '2px solid',
                                                        borderColor: p.position === 'DEF' ? '#40BAF7' : 
                                                                     p.position === 'MEI' ? '#39FF14' : '#FF3333',
                                                        boxShadow: '1px 1px 0 #000'
                                                    }}>
                                                        {p.position === 'DEF' ? 'LAT' : p.position === 'MEI' ? 'VOL' : 'PE'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{padding:'8px', textAlign:'left', position:'relative'}}>
                                            {isSelected && (
                                                <span style={{position:'absolute', left:'-12px', top:'50%', transform:'translateY(-50%)', color:'#FFD700'}}>▶</span>
                                            )}
                                            {p.name}
                                            {p.injury && <span style={{marginLeft:'8px', color:'#FF3333'}}>+</span>}
                                        </td>
                                        <td style={{padding:'8px', textAlign:'center', color:'#FFF'}}>
                                            {p.ovr}%
                                        </td>
                                        <td style={{padding:'8px', textAlign:'center'}}>
                                            {renderHealthBars(p.energy)}
                                        </td>
                                        <td style={{padding:'8px', textAlign:'center', color: p.moral > 70 ? '#39FF14' : p.moral > 40 ? '#FFD700' : '#FF3333'}}>
                                            {p.moral || 50}%
                                        </td>
                                        <td style={{padding:'8px', textAlign:'center'}}>
                                            <div style={{display:'flex', gap:'4px', justifyContent:'center'}}>
                                                {!p.isTitular && !p.injury && p.age <= 23 && (
                                                    <Help id="btn.loan"><button onClick={(e) => { e.stopPropagation(); handleLoan(p.id); }} style={{background:'#222', border:'2px solid #000', color:'#40BAF7', padding:'4px', cursor:'pointer', fontFamily: "'Press Start 2P', monospace", fontSize:'0.5rem'}}>L</button></Help>
                                                )}
                                                {!p.isTitular && (
                                                    <Help id="btn.sell"><button onClick={(e) => { e.stopPropagation(); handleSell(p); }} style={{background:'#222', border:'2px solid #000', color:'#FF3333', padding:'4px', cursor:'pointer', fontFamily: "'Press Start 2P', monospace", fontSize:'0.5rem'}}>S</button></Help>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedId === p.id && (
                                        <tr key={`${p.id}-details`}>
                                            <td colSpan="7" style={{ padding: 0 }}>
                                                <div style={{
                                                    display: 'flex',
                                                    gap: '1rem',
                                                    padding: '1rem',
                                                    background: '#0A0A0A',
                                                    borderTop: '2px solid #4A5059',
                                                    borderBottom: '2px solid #4A5059',
                                                    color: '#CCC',
                                                    fontFamily: 'Outfit, sans-serif'
                                                }}>
                                                    <PentagonChart player={p} size={220} />
                                                    <div style={{ flex: 1, fontSize: '0.85rem' }}>
                                                        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem', color: '#FFF' }}>{p.name}</div>
                                                        <div style={{ marginBottom: '0.5rem' }}>
                                                            {p.naturalPosition ? POSITIONS[p.naturalPosition]?.name : p.position}
                                                            {p.preferredFoot && ` • PÉ: ${p.preferredFoot}`}
                                                            {p.height && ` • ALT: ${p.height}cm`}
                                                            {p.nationality && ` • NAC: ${p.nationality}`}
                                                        </div>
                                                        {p.marketValue > 0 && (
                                                            <div style={{ marginBottom: '0.5rem', color: '#39FF14' }}>
                                                                R$ {p.marketValue.toLocaleString('pt-BR')}
                                                            </div>
                                                        )}
                                                        <div style={{ fontSize: '0.75rem', color: '#FFD700' }}>
                                                            RATING: {p.attacking ? calculateRatingForPosition(p, p.naturalPosition || 'MEC') : p.ovr}
                                                        </div>
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
                    <h3 style={{ marginBottom: '0.75rem' }}>📊 Pentagon Comparison (Top 11 Titulares)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                        {sorted.filter(p => p.isTitular).slice(0, 11).map(p => (
                            <div key={p.id} style={{ border: '4px solid #111417', padding: '8px', textAlign: 'center', background: 'rgba(0,0,0,0.3)' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>{p.name}</div>
                                <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '8px' }}>
                                    {p.naturalPosition || p.position}
                                </div>
                                <PentagonChart player={p} size={180} />
                            </div>
                        ))}
                    </div>
                </EfPanel>
            )}

            {tab === 'contratos' && (
                <EfPanel variant="elev" padding="md">
                    <h3 style={{ marginBottom: '0.75rem' }}>📝 Contratos</h3>
                    <div style={{ overflowX: 'auto' }}>
                    <table className="standings-table">
                        <thead>
                            <tr>
                                <th>Jogador</th>
                                <th>Posição</th>
                                <th>Idade</th>
                                <th>Wage/sem</th>
                                <th>Duração</th>
                                <th>Cláusula</th>
                                <th>Valor Mercado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map(p => (
                                <tr key={p.id}>
                                    <td>{p.name}</td>
                                    <td>{p.naturalPosition || p.position}</td>
                                    <td>{p.age}</td>
                                    <td>R$ {(p.contract?.weeklyWage || 0).toLocaleString('pt-BR')}</td>
                                    <td>{p.contract?.weeksRemaining || p.contract?.weeksLeft || '-'}sem</td>
                                    <td>{p.contract?.releaseClause ? `R$ ${(p.contract.releaseClause / 1e6).toFixed(1)}M` : '-'}</td>
                                    <td>{p.marketValue ? `R$ ${(p.marketValue / 1e6).toFixed(1)}M` : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </EfPanel>
            )}

            {/* Loaned Out */}
            {loanedOut.length > 0 && (
                <EfPanel variant="sunk" padding="md" style={{marginTop:'1rem'}}>
                    <h3 style={{marginBottom:'0.5rem'}}>📤 Emprestados ({loanedOut.length})</h3>
                    <ul className="stats-list">
                        {loanedOut.map((l, i) => (
                            <li key={i}>
                                <span>{l.playerName} → {l.destination}</span>
                                <strong style={{color:'#888'}}>{l.weeksLeft}/{l.totalWeeks} sem</strong>
                            </li>
                        ))}
                    </ul>
                </EfPanel>
            )}
            </div>
        </div>
    );
}
