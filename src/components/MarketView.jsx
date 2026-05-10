import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { SCOUT_REGIONS } from '../engine/StadiumSystem';
import { getPlayerTraits } from '../engine/PlayerTraits';
import { PlayerAvatar } from '../utils/avatar';
import { Tooltip } from './Tooltip';
import { EfClubBadge } from './ui/EfClubBadge';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';
import bgOffice from '../assets/environments/bg_manager_office.png';

export function MarketView() {
    const { gameState, changeView, getEngine, forceUpdate, getDashboardView } = useGame();
    const engine = getEngine();
    const team = engine.getTeam(gameState.teamId);
    if (!team) return null;

    const [tab, setTab] = useState('buy');
    const [log, setLog] = useState('');
    const [negotiation, setNegotiation] = useState(null); // {playerId, round, counterAmount}
    // P1-8/9: filter + search Mercado
    const [marketFilter, setMarketFilter] = useState('all'); // pos
    const [marketSort, setMarketSort] = useState('ovr'); // ovr | price | age | name
    const [marketSearch, setMarketSearch] = useState('');

    const handleBuy = (player) => {
        if (team.balance < player.value) return;
        // Use signScoutedPlayer-like flow via engine
        const idx = engine.marketPlayers.findIndex(p => p.id === player.id);
        if (idx === -1) return;
        team.balance -= player.value;
        player.contract = { weeksLeft: 76, salary: Math.floor(player.value * 0.001) };
        player.moral = 60;
        player.energy = 100;
        team.squad.push({ ...player, isTitular: false });
        engine.marketPlayers.splice(idx, 1);
        setLog(`✅ ${player.name} contratado por R$ ${(player.value / 1000000).toFixed(1)}M!`);
        forceUpdate();
    };

    const handleSell = (player) => {
        const value = player.ovr * 100000;
        setNegotiation({ player, round: 0, counterAmount: value, msg: `Valor de mercado: R$ ${(value / 1000000).toFixed(1)}M. Deseja vender?` });
    };

    const confirmSell = () => {
        if (!negotiation) return;
        const p = negotiation.player;
        const result = engine.sellPlayer(p.id, negotiation.counterAmount);
        setLog(result.msg);
        setNegotiation(null);
        forceUpdate();
    };

    const handleScout = (regionId) => {
        const result = engine.scoutRegionAction(regionId);
        setLog(result.msg || `Scout encontrou ${result.players?.length || 0} jogadores!`);
        forceUpdate();
    };

    const sellable = team.squad.filter(p => !p.isTitular && !p.injury);

    return (
        <div className="ef-anim-fade-in" style={{
            backgroundImage: `url(${bgOffice})`,
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

            <EfPanel variant="elev" padding="md" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px', flexWrap: 'wrap'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <EfClubBadge name={team.name} size="md" />
                    <h2 style={{fontSize:'1.2rem',margin:0}}>🛒 MERCADO — {team.name}</h2>
                </div>
                <EfButton variant="secondary" size="sm" onClick={() => changeView(getDashboardView())}>← Voltar</EfButton>
            </EfPanel>

            <EfPanel variant="sunk" padding="md">
                <div className="inline-stats" style={{justifyContent:'center'}}>
                    <div className="inline-stat">
                        <span className="stat-value" style={{fontSize:'1.2rem',color: team.balance > 0 ? 'var(--primary)' : 'var(--danger)'}}>R$ {(team.balance / 1000000).toFixed(1)}M</span>
                        <span className="stat-label">SALDO</span>
                    </div>
                    <div className="inline-stat">
                        <span className="stat-value" style={{fontSize:'1.2rem'}}>{team.squad.length}</span>
                        <span className="stat-label">ELENCO</span>
                    </div>
                </div>
            </EfPanel>

            {log && <div className="event-toast success" onClick={() => setLog('')}>{log}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
                <EfButton variant={tab === 'buy' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('buy')} style={{justifyContent: 'center'}}>COMPRAR</EfButton>
                <EfButton variant={tab === 'sell' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('sell')} style={{justifyContent: 'center'}}>VENDER</EfButton>
                <EfButton variant={tab === 'scout' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('scout')} style={{justifyContent: 'center'}}>SCOUTING</EfButton>
            </div>

            {/* === BUY TAB === */}
            {tab === 'buy' && (
                <EfPanel variant="elev" padding="md">
                    {/* P1-8/9 controls */}
                    <div style={{display:'flex',gap:'0.4rem',marginBottom:'1rem',flexWrap:'wrap'}}>
                        <input
                            type="text"
                            placeholder="🔍 Buscar..."
                            value={marketSearch}
                            onChange={(e) => setMarketSearch(e.target.value)}
                            style={{flex:'1 1 150px',padding:'8px 12px',background:'rgba(0,0,0,0.5)',border:'2px solid var(--ef-bevel-dark)',color:'white',fontSize:'0.85rem', outline:'none', fontWeight: 600}}
                        />
                        <select value={marketFilter} onChange={(e) => setMarketFilter(e.target.value)} style={{padding:'8px 12px',background:'var(--ef-color-neutral-bg)',border:'2px solid var(--ef-bevel-dark)',color:'white',fontSize:'0.85rem', outline:'none', fontWeight: 600}}>
                            <option value="all">Todas pos</option>
                            <option value="GOL">GOL</option>
                            <option value="DEF">DEF</option>
                            <option value="MEI">MEI</option>
                            <option value="ATA">ATA</option>
                        </select>
                        <select value={marketSort} onChange={(e) => setMarketSort(e.target.value)} style={{padding:'8px 12px',background:'var(--ef-color-neutral-bg)',border:'2px solid var(--ef-bevel-dark)',color:'white',fontSize:'0.85rem', outline:'none', fontWeight: 600}}>
                            <option value="ovr">OVR ↓</option>
                            <option value="price">Preço ↑</option>
                            <option value="age">Idade ↑</option>
                            <option value="name">Nome A-Z</option>
                        </select>
                    </div>
                    {(() => {
                        let market = [...(engine.marketPlayers || [])];
                        if (marketFilter !== 'all') market = market.filter(p => p.position === marketFilter);
                        if (marketSearch.trim()) {
                            const q = marketSearch.toLowerCase();
                            market = market.filter(p => p.name.toLowerCase().includes(q));
                        }
                        const sorts = {
                            ovr: (a, b) => b.ovr - a.ovr,
                            price: (a, b) => (a.value || 0) - (b.value || 0),
                            age: (a, b) => a.age - b.age,
                            name: (a, b) => a.name.localeCompare(b.name)
                        };
                        market.sort(sorts[marketSort] || sorts.ovr);
                        return (
                    <>
                    <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.3rem'}}>JOGADORES DISPONÍVEIS ({market.length}/{engine.marketPlayers?.length ?? 0})</h4>
                    {market.length === 0 ? (
                        <p style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>Nenhum jogador. Scout novas regiões ou ajuste filtros!</p>
                    ) : (
                        <div style={{display:'flex',flexDirection:'column',gap:'0.15rem'}}>
                            {market.map(p => (
                                <div key={p.id} className={`ef-anim-fade-in ${p.ovr >= 80 ? 'ef-anim-pulse-glow' : ''}`} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.3rem 0',borderBottom:'1px solid var(--border-subtle)',fontSize:'0.78rem'}}>
                                    <div style={{display:'flex',alignItems:'center'}}>
                                        <PlayerAvatar name={p.name} size={24} />
                                        <strong>{p.name}</strong>
                                        <span className={`pos-badge ${p.position}`} style={{marginLeft:'0.3rem'}}>{p.position}</span>
                                        <span style={{color:'var(--text-muted)',marginLeft:'0.3rem'}}>OVR {p.ovr} • {p.age}a</span>
                                        {getPlayerTraits(p).map(t => (
                                            <Tooltip key={t.id} content={`${t.name}: ${t.description}`}><span style={{fontSize:'0.65rem',marginLeft:'2px'}}>{t.name.split(' ')[0]}</span></Tooltip>
                                        ))}
                                    </div>
                                    <div style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
                                        <span style={{fontSize:'0.72rem',color:'var(--accent)'}}>R$ {(p.value / 1000000).toFixed(1)}M</span>
                                        <EfButton variant="primary" size="sm" onClick={() => handleBuy(p)} disabled={team.balance < p.value}>
                                            Contratar
                                        </EfButton>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    </>
                        );
                    })()}
                </EfPanel>
            )}

            {/* === SELL TAB === */}
            {tab === 'sell' && (
                <EfPanel variant="elev" padding="md">
                    <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.3rem'}}>JOGADORES VENDÁVEIS ({sellable.length})</h4>
                    {sellable.length === 0 ? (
                        <p style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>Tire jogadores da titularidade para poder vendê-los.</p>
                    ) : (
                        <div style={{display:'flex',flexDirection:'column',gap:'0.15rem'}}>
                            {sellable.sort((a,b) => b.ovr - a.ovr).map(p => (
                                <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.3rem 0',borderBottom:'1px solid var(--border-subtle)',fontSize:'0.78rem'}}>
                                    <div>
                                        <strong>{p.name}</strong>
                                        <span style={{color:'var(--text-muted)',marginLeft:'0.3rem'}}>{p.position} • OVR {p.ovr} • {p.age}a</span>
                                    </div>
                                    <div style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
                                        <span style={{fontSize:'0.72rem',color:'var(--accent)'}}>~R$ {((p.ovr * 100000) / 1000000).toFixed(1)}M</span>
                                        <EfButton variant="danger" size="sm" onClick={() => handleSell(p)}>Vender</EfButton>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Negotiation modal */}
                    {negotiation && (
                        <div style={{marginTop:'0.75rem',padding:'0.75rem',background:'rgba(245,158,11,0.08)',borderRadius:'var(--radius-sm)',border:'1px solid rgba(245,158,11,0.2)'}}>
                            <p style={{fontSize:'0.8rem',color:'var(--accent)',marginBottom:'0.3rem'}}>💬 {negotiation.msg}</p>
                            <p style={{fontSize:'0.85rem',fontWeight:600}}>R$ {(negotiation.counterAmount / 1000000).toFixed(1)}M</p>
                            <div style={{display:'flex',gap:'0.3rem',marginTop:'0.4rem'}}>
                                <EfButton variant="primary" size="sm" onClick={confirmSell}>✓ Aceitar</EfButton>
                                <EfButton variant="secondary" size="sm" onClick={() => {
                                    // Counter-offer: increase price
                                    const newAmount = Math.floor(negotiation.counterAmount * 1.15);
                                    if (negotiation.round >= 2) {
                                        setLog(`❌ ${negotiation.player.name}: negociação encerrada.`);
                                        setNegotiation(null);
                                    } else {
                                        setNegotiation({
                                            ...negotiation,
                                            round: negotiation.round + 1,
                                            counterAmount: newAmount,
                                            msg: `Contra-proposta: R$ ${(newAmount / 1000000).toFixed(1)}M (rodada ${negotiation.round + 2}/3)`,
                                        });
                                    }
                                }}>📈 Pedir mais</EfButton>
                                <EfButton variant="secondary" size="sm" onClick={() => setNegotiation(null)}>✗ Cancelar</EfButton>
                            </div>
                        </div>
                    )}
                </EfPanel>
            )}

            {/* === SCOUT TAB === */}
            {tab === 'scout' && (
                <EfPanel variant="elev" padding="md">
                    <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.3rem'}}>🔎 REGIÕES DE SCOUTING</h4>
                    <div className="action-bar" style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                        {SCOUT_REGIONS.map(r => (
                            <EfButton key={r.id} variant="secondary" size="sm" onClick={() => handleScout(r.id)}>
                                {r.emoji} {r.name} (R$ {(r.cost/1000).toFixed(0)}K)
                            </EfButton>
                        ))}
                    </div>
                    {engine.scoutedPlayers?.length > 0 && (
                        <div style={{marginTop:'0.5rem'}}>
                            <h4 style={{fontSize:'0.75rem',color:'var(--text-muted)',marginBottom:'0.2rem'}}>ENCONTRADOS</h4>
                            {engine.scoutedPlayers.map((p, i) => (
                                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'0.78rem',padding:'0.25rem 0',borderBottom:'1px solid var(--border-subtle)'}}>
                                    <span>{p.name} ({p.position}, {p.age}a, OVR {p.ovr})</span>
                                    <EfButton variant="primary" size="sm" onClick={() => {
                                        const result = engine.signScoutedPlayer(i);
                                        setLog(result?.msg || 'Contratado!');
                                        forceUpdate();
                                    }}>Contratar</EfButton>
                                </div>
                            ))}
                        </div>
                    )}
                </EfPanel>
            )}
            </div>
        </div>
    );
}
