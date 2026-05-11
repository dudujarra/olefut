import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { SCOUT_REGIONS } from '../engine/StadiumSystem';
import { PlayerAvatar } from '../utils/avatar';
import { Tooltip } from './Tooltip';
import { EfClubBadge } from './ui/EfClubBadge';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';
import bgOffice from '../assets/environments/bg_transfer_market.png';
import { ShoppingCart, Bank, CurrencyDollar, MagnifyingGlass, Funnel, Users, Storefront, ChartLineUp, Handshake, GlobeHemisphereWest, CheckCircle } from '@phosphor-icons/react';

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
        const idx = engine.marketPlayers.findIndex(p => p.id === player.id);
        if (idx === -1) return;
        team.balance -= player.value;
        player.contract = { weeksLeft: 76, salary: Math.floor(player.value * 0.001) };
        player.moral = 60;
        player.energy = 100;
        team.squad.push({ ...player, isTitular: false });
        engine.marketPlayers.splice(idx, 1);
        setLog(`✅ CONTRATADO: ${player.name} (R$ ${(player.value / 1000000).toFixed(1)}M)`);
        forceUpdate();
    };

    const handleSell = (player) => {
        const value = player.ovr * 100000;
        setNegotiation({ player, round: 0, counterAmount: value, msg: `VALOR DE MERCADO: R$ ${(value / 1000000).toFixed(1)}M. DESEJA VENDER?` });
    };

    const confirmSell = () => {
        if (!negotiation) return;
        const p = negotiation.player;
        const result = engine.sellPlayer(p.id, negotiation.counterAmount);
        setLog(`💰 ${result.msg.toUpperCase()}`);
        setNegotiation(null);
        forceUpdate();
    };

    const handleScout = (regionId) => {
        const result = engine.scoutRegionAction(regionId);
        setLog(result.msg.toUpperCase() || `SCOUT: ENCONTRADOS ${result.players?.length || 0} JOGADORES!`);
        forceUpdate();
    };

    const sellable = team.squad.filter(p => !p.isTitular && !p.injury);
    const fontMono = { fontFamily: "'JetBrains Mono', 'Geist Mono', monospace" };

    return (
        <div className="ef-anim-fade-in ef-layout-pitch" style={{ backgroundImage: `url(${bgOffice})` }}>
            <div className="ef-layout-container" style={{ maxWidth: '1100px' }}>

                {/* HEADER HERO */}
                <EfPanel variant="elev" padding="md" className="ef-flex-row" style={{ justifyContent: 'space-between' }}>
                    <div className="ef-flex-row">
                        <EfClubBadge name={team.name} size="md" />
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)', fontFamily: 'Satoshi, sans-serif' }}>
                                Mercado de Transferências
                            </h2>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', ...fontMono }}>
                                DIRETORIA FINANCEIRA
                            </div>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>SAIR</EfButton>
                </EfPanel>

                {/* FINANCES BENTO */}
                <EfPanel variant="sunk" padding="md" className="ef-flex-row" style={{ justifyContent: 'space-around' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem', ...fontMono }}>
                            <Bank size={16} /> SALDO DISPONÍVEL
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: team.balance > 0 ? 'var(--primary)' : 'var(--danger)', ...fontMono }}>
                            R$ {(team.balance / 1000000).toFixed(1)}M
                        </div>
                    </div>
                    <div style={{ width: '2px', background: 'var(--border-panel)', alignSelf: 'stretch' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem', ...fontMono }}>
                            <Users size={16} /> ELENCO
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', ...fontMono }}>
                            {team.squad.length}
                        </div>
                    </div>
                </EfPanel>

                {/* NOTIFICATION LOG */}
                {log && (
                    <div className="ef-anim-pulse-glow" onClick={() => setLog('')} style={{
                        background: '#064E3B', 
                        border: '2px solid #10B981', 
                        color: '#FFF', 
                        padding: '12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        ...fontMono
                    }}>
                        <CheckCircle size={20} weight="fill" color="#10B981" />
                        {log}
                    </div>
                )}

                {/* TAB SELECTORS */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <EfButton variant={tab === 'buy' ? 'primary' : 'secondary'} size="lg" onClick={() => setTab('buy')} style={{flex: 1}}>
                        <ShoppingCart size={20} /> COMPRAR
                    </EfButton>
                    <EfButton variant={tab === 'sell' ? 'primary' : 'secondary'} size="lg" onClick={() => setTab('sell')} style={{flex: 1}}>
                        <CurrencyDollar size={20} /> VENDER
                    </EfButton>
                    <EfButton variant={tab === 'scout' ? 'primary' : 'secondary'} size="lg" onClick={() => setTab('scout')} style={{flex: 1}}>
                        <GlobeHemisphereWest size={20} /> SCOUTING
                    </EfButton>
                </div>

                {/* === BUY TAB === */}
                {tab === 'buy' && (
                    <EfPanel variant="default" padding="md">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-main)', ...fontMono, fontSize: '0.85rem' }}>
                            <Storefront size={20} color="var(--primary)" /> JOGADORES DISPONÍVEIS
                        </div>
                        
                        <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <MagnifyingGlass size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="text"
                                    placeholder="NOME DO JOGADOR..."
                                    value={marketSearch}
                                    onChange={(e) => setMarketSearch(e.target.value)}
                                    style={{
                                        width: '100%', padding: '12px 12px 12px 36px', 
                                        background: 'var(--bg-sunk)', border: '2px solid var(--border-panel)', 
                                        color: 'var(--text-main)', ...fontMono, fontSize: '0.8rem', outline: 'none',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', position: 'relative', width: '160px' }}>
                                <Funnel size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                <select value={marketFilter} onChange={(e) => setMarketFilter(e.target.value)} style={{
                                    width: '100%', padding: '12px 12px 12px 36px', 
                                    background: 'var(--bg-sunk)', border: '2px solid var(--border-panel)', 
                                    color: 'var(--text-main)', ...fontMono, fontSize: '0.8rem', outline: 'none', appearance: 'none',
                                    borderRadius: '4px'
                                }}>
                                    <option value="all">TODAS POS</option>
                                    <option value="GOL">GOL</option>
                                    <option value="DEF">DEF</option>
                                    <option value="MEI">MEI</option>
                                    <option value="ATA">ATA</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', position: 'relative', width: '180px' }}>
                                <ChartLineUp size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                <select value={marketSort} onChange={(e) => setMarketSort(e.target.value)} style={{
                                    width: '100%', padding: '12px 12px 12px 36px', 
                                    background: 'var(--bg-sunk)', border: '2px solid var(--border-panel)', 
                                    color: 'var(--text-main)', ...fontMono, fontSize: '0.8rem', outline: 'none', appearance: 'none',
                                    borderRadius: '4px'
                                }}>
                                    <option value="ovr">MAIOR OVR</option>
                                    <option value="price">MAIOR PREÇO</option>
                                    <option value="age">MAIS VELHO</option>
                                    <option value="name">A-Z</option>
                                </select>
                            </div>
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
                                price: (a, b) => (b.value || 0) - (a.value || 0),
                                age: (a, b) => b.age - a.age,
                                name: (a, b) => a.name.localeCompare(b.name)
                            };
                            market.sort(sorts[marketSort] || sorts.ovr);
                            return (
                                <>
                                    {market.length === 0 ? (
                                        <div style={{ background: 'var(--bg-sunk)', padding: '32px', textAlign: 'center', border: '2px dashed var(--border-panel)', color: 'var(--text-muted)', ...fontMono }}>
                                            NENHUM JOGADOR ENCONTRADO.
                                        </div>
                                    ) : (
                                        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                                            {market.map(p => (
                                                <div key={p.id} className="ef-anim-fade-in" style={{
                                                    display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px',
                                                    background: 'var(--bg-sunk)', border: '1px solid var(--border-panel)',
                                                    borderLeft: p.ovr >= 80 ? '4px solid var(--accent)' : '4px solid var(--border-panel)'
                                                }}>
                                                    <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                                                        <PlayerAvatar name={p.name} size={40} />
                                                        <div>
                                                            <div style={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px', fontFamily: 'Satoshi, sans-serif', fontSize: '1.1rem' }}>
                                                                {p.name.toUpperCase()}
                                                            </div>
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', ...fontMono, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ color: 'var(--bg-dark)', background: 'var(--text-muted)', padding: '2px 6px', borderRadius: '2px', fontWeight: 'bold' }}>{p.position}</span>
                                                                <span>OVR <strong style={{ color: p.ovr >= 80 ? 'var(--accent)' : 'var(--text-main)' }}>{p.ovr}</strong></span>
                                                                <span>•</span>
                                                                <span>{p.age} ANOS</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display:'flex', alignItems:'center', gap:'24px' }}>
                                                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)', ...fontMono }}>
                                                            R$ {(p.value / 1000000).toFixed(1)}M
                                                        </span>
                                                        <EfButton variant="primary" size="md" onClick={() => handleBuy(p)} disabled={team.balance < p.value}>
                                                            COMPRAR
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
                    <EfPanel variant="default" padding="md">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-main)', ...fontMono, fontSize: '0.85rem' }}>
                            <Handshake size={20} color="var(--accent)" /> SEU ELENCO (VENDÁVEIS)
                        </div>

                        {sellable.length === 0 ? (
                            <div style={{ background: 'var(--bg-sunk)', padding: '32px', textAlign: 'center', border: '2px dashed var(--border-panel)', color: 'var(--text-muted)', ...fontMono }}>
                                NENHUM JOGADOR VENDÁVEL. TIRE-OS DA TITULARIDADE PRIMEIRO.
                            </div>
                        ) : (
                            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                                {sellable.sort((a,b) => b.ovr - a.ovr).map(p => (
                                    <div key={p.id} style={{
                                        display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px',
                                        background: 'var(--bg-sunk)', border: '1px solid var(--border-panel)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <PlayerAvatar name={p.name} size={40} />
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px', fontFamily: 'Satoshi, sans-serif', fontSize: '1.1rem' }}>
                                                    {p.name.toUpperCase()}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', ...fontMono, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ color: 'var(--bg-dark)', background: 'var(--text-muted)', padding: '2px 6px', borderRadius: '2px', fontWeight: 'bold' }}>{p.position}</span>
                                                    <span>OVR <strong style={{ color: 'var(--text-main)' }}>{p.ovr}</strong></span>
                                                    <span>•</span>
                                                    <span>{p.age} ANOS</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display:'flex', alignItems:'center', gap:'24px' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)', ...fontMono }}>
                                                ~R$ {((p.ovr * 100000) / 1000000).toFixed(1)}M
                                            </span>
                                            <EfButton variant="danger" size="md" onClick={() => handleSell(p)}>VENDER</EfButton>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {negotiation && (
                            <div className="ef-anim-fade-in" style={{
                                marginTop: '16px', padding: '24px',
                                background: '#2E1A05', border: '2px solid var(--accent)',
                                borderRadius: '4px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', marginBottom: '8px', ...fontMono, fontSize: '0.75rem' }}>
                                    <Handshake size={16} /> {negotiation.msg}
                                </div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '24px', ...fontMono }}>
                                    R$ {(negotiation.counterAmount / 1000000).toFixed(1)}M
                                </div>
                                <div style={{ display:'flex', gap:'8px' }}>
                                    <EfButton variant="primary" size="md" onClick={confirmSell}>ACEITAR</EfButton>
                                    <EfButton variant="secondary" size="md" onClick={() => {
                                        const newAmount = Math.floor(negotiation.counterAmount * 1.15);
                                        if (negotiation.round >= 2) {
                                            setLog(`❌ NEGOCIAÇÃO ENCERRADA.`);
                                            setNegotiation(null);
                                        } else {
                                            setNegotiation({
                                                ...negotiation,
                                                round: negotiation.round + 1,
                                                counterAmount: newAmount,
                                                msg: `CONTRA-PROPOSTA (TENTATIVA ${negotiation.round + 2}/3)`,
                                            });
                                        }
                                    }}>PEDIR MAIS</EfButton>
                                    <EfButton variant="danger" size="md" onClick={() => setNegotiation(null)}>CANCELAR</EfButton>
                                </div>
                            </div>
                        )}
                    </EfPanel>
                )}

                {/* === SCOUT TAB === */}
                {tab === 'scout' && (
                    <EfPanel variant="default" padding="md">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-main)', ...fontMono, fontSize: '0.85rem' }}>
                            <GlobeHemisphereWest size={20} color="var(--primary)" /> AGÊNCIA DE SCOUTING (OLHEIROS)
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                            {SCOUT_REGIONS.map(r => (
                                <EfButton key={r.id} variant="secondary" size="lg" onClick={() => handleScout(r.id)} style={{ justifyContent: 'flex-start', padding: '16px', height: 'auto' }}>
                                    <span style={{ fontSize: '2rem', marginRight: '16px' }}>{r.emoji}</span>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px', fontFamily: 'Satoshi, sans-serif' }}>{r.name.toUpperCase()}</div>
                                        <div style={{ color: 'var(--accent)', ...fontMono, fontSize: '0.75rem' }}>CUSTO: R$ {(r.cost/1000).toFixed(0)}K</div>
                                    </div>
                                </EfButton>
                            ))}
                        </div>

                        {engine.scoutedPlayers?.length > 0 && (
                            <div style={{ marginTop:'32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--accent)', ...fontMono, fontSize: '0.85rem' }}>
                                    <Users size={16} /> JOGADORES ENCONTRADOS
                                </div>
                                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                                    {engine.scoutedPlayers.map((p, i) => (
                                        <div key={i} className="ef-anim-fade-in" style={{
                                            display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px',
                                            background: 'var(--bg-sunk)', border: '1px solid var(--border-panel)',
                                            borderLeft: '4px solid var(--primary)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <PlayerAvatar name={p.name} size={40} />
                                                <div>
                                                    <div style={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px', fontFamily: 'Satoshi, sans-serif', fontSize: '1.1rem' }}>
                                                        {p.name.toUpperCase()}
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', ...fontMono, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ color: 'var(--bg-dark)', background: 'var(--text-muted)', padding: '2px 6px', borderRadius: '2px', fontWeight: 'bold' }}>{p.position}</span>
                                                        <span>OVR <strong style={{ color: p.ovr >= 80 ? 'var(--accent)' : 'var(--text-main)' }}>{p.ovr}</strong></span>
                                                        <span>•</span>
                                                        <span>{p.age} ANOS</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <EfButton variant="primary" size="md" onClick={() => {
                                                const result = engine.signScoutedPlayer(i);
                                                setLog(result?.msg.toUpperCase() || 'CONTRATADO!');
                                                forceUpdate();
                                            }}>CONTRATAR</EfButton>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </EfPanel>
                )}
            </div>
        </div>
    );
}

