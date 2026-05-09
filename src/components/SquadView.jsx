import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { getFormEmoji } from '../engine/PlayerDevelopment';
import { getPlayerTraits } from '../engine/PlayerTraits';
import { PlayerAvatar } from '../utils/avatar';
import { Help } from './Help';
import { Tooltip } from './Tooltip';
import { EfClubBadge } from './ui';
import { PentagonChart } from './PentagonChart';
import { POSITIONS, getMacroPosition, calculateRatingForPosition, calculateEffectiveRating } from '../engine/Positions';
import { injectSquadIntoTeam } from '../services/SquadDataService';

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
    };
    const sorted = filtered.sort(sorters[sortBy] || sorters.position);

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

    const getEnergyColor = (e) => e > 60 ? 'var(--primary)' : e > 30 ? 'var(--accent)' : 'var(--danger)';
    const getMoralEmoji = (m) => m > 70 ? '😊' : m > 40 ? '😐' : '😞';

    const back = gameState.mode === 'player' ? 'player_dashboard' : 'dashboard';

    // Loaned out players
    const loanedOut = engine.loanedOut || [];

    return (
        <div className="main-content fade-in ef-art-bg ef-art-players">
            <div className="card-header" style={{ marginBottom: '1rem', display:'flex', alignItems:'center', gap:'12px' }}>
                <EfClubBadge name={team.name} size="md" />
                <h2 style={{margin:0,flex:1}}>👥 Plantel — {team.name} ({sorted.length}/{team.squad.length} jogadores)</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => changeView(back)}>← Voltar</button>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={handleLoadRealSquad}
                    disabled={loadingReal}
                    title="Carregar plantel real do SofaScore (se disponível)"
                >
                    {loadingReal ? '⏳ Carregando...' : '🌐 Plantel Real'}
                </button>
            </div>

            {/* SPEC-080 Tabs */}
            <div className="nav-tabs" style={{ display: 'flex', gap: '4px', marginBottom: '0.75rem', borderBottom: '2px solid var(--border-subtle, #2a3530)' }}>
                {[
                    { id: 'plantel', label: '👥 Plantel' },
                    { id: 'stats', label: '📊 Stats' },
                    { id: 'contratos', label: '📝 Contratos' }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className="btn btn-sm"
                        style={{
                            background: tab === t.id ? 'var(--accent)' : 'transparent',
                            color: tab === t.id ? '#0F1A14' : 'var(--text)',
                            border: 'none',
                            borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                            borderRadius: '4px 4px 0 0',
                            padding: '0.5rem 1rem'
                        }}
                    >{t.label}</button>
                ))}
            </div>

            {/* P1-8/9: filter + sort + search */}
            <div className="squad-controls" style={{display:'flex',gap:'0.5rem',marginBottom:'0.75rem',flexWrap:'wrap'}}>
                <input
                    type="text"
                    placeholder="🔍 Buscar jogador..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{flex:'1 1 200px',padding:'0.45rem 0.75rem',background:'var(--bg-panel-solid)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-sm)',color:'var(--text-main)',fontSize:'0.85rem'}}
                />
                <select value={filterPos} onChange={(e) => setFilterPos(e.target.value)} style={{padding:'0.45rem 0.75rem',background:'var(--bg-panel-solid)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-sm)',color:'var(--text-main)',fontSize:'0.85rem'}}>
                    <option value="all">Todas posições</option>
                    <option value="GOL">GOL</option>
                    <option value="DEF">DEF</option>
                    <option value="MEI">MEI</option>
                    <option value="ATA">ATA</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{padding:'0.45rem 0.75rem',background:'var(--bg-panel-solid)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-sm)',color:'var(--text-main)',fontSize:'0.85rem'}}>
                    <option value="position">Ordenar: Posição</option>
                    <option value="ovr">Ordenar: OVR ↓</option>
                    <option value="age">Ordenar: Idade ↑</option>
                    <option value="energy">Ordenar: Energia ↓</option>
                    <option value="name">Ordenar: Nome A-Z</option>
                </select>
            </div>

            {tab === 'plantel' && (
            <div style={{ overflowX: 'auto' }}>
                <table className="standings-table">
                    <thead>
                        <tr>
                            <th>Status</th><th>Nome</th><th>Pos</th><th>OVR</th>
                            <th className="hide-mobile">⚡</th><th className="hide-mobile">😊</th><th className="hide-mobile">🔥</th><th className="hide-mobile">Idade</th><th className="hide-mobile">📋</th><th className="hide-mobile">🏥</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map(p => (
                          <React.Fragment key={p.id}>
                            <tr className={p.isTitular ? 'highlight' : ''} style={p.injury ? {opacity: 0.6} : {}}>
                                <td>
                                    <button
                                        className={`btn btn-sm ${p.isTitular ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => toggleTitular(p.id)}
                                        disabled={!!p.injury}
                                    >
                                        {p.injury ? '🏥' : p.isTitular ? '⭐' : '🔄'}
                                    </button>
                                </td>
                                <td>
                                    <span style={{display:'inline-flex',alignItems:'center'}}>
                                        <PlayerAvatar name={p.name} size={26} />
                                        {p.name}
                                    </span>
                                    {p._isCaptain && <Tooltip content="Capitão: lidera o vestiário, +5 moral coletiva."><span style={{marginLeft:'3px'}}>©️</span></Tooltip>}
                                    {p.isYouth && <Tooltip content="Jovem da base: oriundo da academia."><span style={{color:'var(--accent)',fontSize:'0.7rem',marginLeft:'4px'}}>🎓</span></Tooltip>}
                                    {getPlayerTraits(p).map(t => (
                                        <Tooltip key={t.id} content={`${t.name}: ${t.description}`}><span style={{fontSize:'0.65rem',marginLeft:'2px'}}>{t.name.split(' ')[0]}</span></Tooltip>
                                    ))}
                                    {p.career && (p.career.seasonGoals > 0 || p.career.seasonAssists > 0) && (
                                        <span style={{fontSize:'0.6rem',color:'var(--primary)',marginLeft:'4px'}}>
                                            {p.career.seasonGoals > 0 ? `${p.career.seasonGoals}G` : ''}{p.career.seasonAssists > 0 ? ` ${p.career.seasonAssists}A` : ''}
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <span
                                        className={`pos-badge ${p.position}`}
                                        title={p.naturalPosition ? POSITIONS[p.naturalPosition]?.name : p.position}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                                    >
                                        <span className={`ef-pos-icon ${p.position}`} aria-hidden="true" />
                                        {p.naturalPosition || p.position}
                                    </span>
                                </td>
                                <td><strong>{p.ovr}</strong></td>
                                <td className="hide-mobile" style={{ color: getEnergyColor(p.energy) }}>{p.energy}%</td>
                                <td className="hide-mobile">{getMoralEmoji(p.moral || 50)} {(p.moral || 50)}%</td>
                                <td className="hide-mobile">{getFormEmoji(p.form?.trend)}</td>
                                <td className="hide-mobile">{p.age}</td>
                                <td className="hide-mobile" style={{color: p.contract?.weeksLeft <= 8 ? 'var(--danger)' : 'var(--text-muted)', fontSize: '0.75rem'}}>
                                    {p.contract ? `${p.contract.weeksLeft}sem` : '-'}
                                </td>
                                <td className="hide-mobile" style={{fontSize: '0.75rem'}}>
                                    {p.injury ? (
                                        <span style={{color:'var(--danger)'}}>{p.injury.emoji} {p.injury.weeksLeft}sem</span>
                                    ) : '-'}
                                </td>
                                <td>
                                    <div style={{display:'flex',gap:'0.25rem'}}>
                                        {!p.isTitular && !p.injury && p.age <= 23 && (
                                            <Help id="btn.loan"><button className="btn btn-sm btn-secondary" onClick={() => handleLoan(p.id)}>📤</button></Help>
                                        )}
                                        {!p.isTitular && (
                                            <Help id="btn.sell"><button className="btn btn-sm btn-danger" onClick={() => handleSell(p)}>💰</button></Help>
                                        )}
                                        {p.contract && p.contract.weeksLeft <= 12 && (
                                            <Help id="btn.renew"><button className="btn btn-sm btn-primary" onClick={() => {
                                                const result = engine.renewContract(p.id);
                                                if (result.success) forceUpdate();
                                            }}>📝</button></Help>
                                        )}
                                    </div>
                                </td>
                            </tr>
                            {expandedId === p.id && (
                                <tr key={`${p.id}-pentagon`}>
                                    <td colSpan="11" style={{ padding: 0 }}>
                                        <div style={{
                                            display: 'flex',
                                            gap: '1rem',
                                            padding: '1rem',
                                            background: 'rgba(15,26,20,0.5)',
                                            border: '1px solid rgba(255,215,0,0.3)',
                                            borderRadius: '4px',
                                            margin: '4px'
                                        }}>
                                            <PentagonChart player={p} size={220} />
                                            <div style={{ flex: 1, fontSize: '0.85rem' }}>
                                                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>{p.name}</div>
                                                <div style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                                    🏷️ {p.naturalPosition ? POSITIONS[p.naturalPosition]?.name : p.position}
                                                    {p.preferredFoot && ` • 🦶 ${p.preferredFoot}`}
                                                    {p.height && ` • 📏 ${p.height}cm`}
                                                    {p.nationality && ` • 🌍 ${p.nationality}`}
                                                </div>
                                                {p.marketValue > 0 && (
                                                    <div style={{ marginBottom: '0.5rem' }}>
                                                        💰 R$ {p.marketValue.toLocaleString('pt-BR')}
                                                    </div>
                                                )}
                                                <div style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>
                                                    Rating natural ({p.naturalPosition || p.position}): <strong>{p.attacking ? calculateRatingForPosition(p, p.naturalPosition || 'MEC') : p.ovr}</strong>
                                                </div>
                                                {p.secondaryPositions?.length > 0 && (
                                                    <div style={{ fontSize: '0.7rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                                                        Secundárias: {p.secondaryPositions.map(sp => POSITIONS[sp]?.name).filter(Boolean).join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                          </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            )}

            {tab === 'stats' && (
                <div className="card" style={{ padding: '1rem' }}>
                    <h3 style={{ marginBottom: '0.75rem' }}>📊 Pentagon Comparison (Top 11 Titulares)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                        {sorted.filter(p => p.isTitular).slice(0, 11).map(p => (
                            <div key={p.id} style={{ border: '1px solid var(--border-subtle, #2a3530)', borderRadius: '4px', padding: '8px', textAlign: 'center' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>{p.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                    {p.naturalPosition || p.position}
                                </div>
                                <PentagonChart player={p} size={180} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'contratos' && (
                <div className="card" style={{ padding: '1rem' }}>
                    <h3 style={{ marginBottom: '0.75rem' }}>📝 Contratos</h3>
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
            )}

            {/* Loaned Out */}
            {loanedOut.length > 0 && (
                <div className="card" style={{marginTop:'1rem'}}>
                    <h3 style={{marginBottom:'0.5rem'}}>📤 Emprestados ({loanedOut.length})</h3>
                    <ul className="stats-list">
                        {loanedOut.map((l, i) => (
                            <li key={i}>
                                <span>{l.playerName} → {l.destination}</span>
                                <strong style={{color:'var(--text-muted)'}}>{l.weeksLeft}/{l.totalWeeks} sem</strong>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
