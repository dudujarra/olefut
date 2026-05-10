import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { SCOUT_REGIONS } from '../engine/StadiumSystem';
import { getPlayerTraits } from '../engine/PlayerTraits';
import { PlayerAvatar } from '../utils/avatar';
import { Tooltip } from './Tooltip';
import { EfClubBadge } from './ui/EfClubBadge';
import { EfButton } from './ui/EfButton';
import bgOffice from '../assets/environments/bg_transfer_market.png';

// 16-bit Brutalist Panel Component for Market
const MarketPanel = ({ children, title, flex }) => (
    <div style={{
        background: '#1E2124',
        border: '4px solid',
        borderColor: '#4A5059 #111417 #111417 #4A5059',
        padding: '16px',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
        flex: flex || 'none',
        display: 'flex',
        flexDirection: 'column'
    }}>
        {title && (
            <div style={{
                background: '#111',
                padding: '8px',
                borderBottom: '2px solid #333',
                marginBottom: '12px',
                fontFamily: "'Press Start 2P', monospace",
                color: '#FFD700',
                fontSize: '0.7rem',
                textShadow: '2px 2px 0 #000'
            }}>
                {title}
            </div>
        )}
        {children}
    </div>
);

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
            color: '#E2E8F0',
            fontFamily: "'Outfit', sans-serif"
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* HEADER */}
                <div style={{
                    background: '#1E2124',
                    border: '4px solid',
                    borderColor: '#4A5059 #111417 #111417 #4A5059',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 8px 0 rgba(0,0,0,0.8)'
                }}>
                    <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
                        <EfClubBadge name={team.name} size="md" />
                        <div>
                            <h2 style={{fontFamily: "'Press Start 2P', monospace", color: '#FFD700', margin: '0 0 8px 0', fontSize: '1.2rem', textShadow: '3px 3px 0 #000'}}>MERCADO DE TRANSFERÊNCIAS</h2>
                            <span style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem', color: '#888'}}>DIRETORIA FINANCEIRA</span>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>SAIR</EfButton>
                </div>

                {/* CLUB FINANCES */}
                <div style={{
                    background: '#111',
                    border: '4px solid',
                    borderColor: '#333 #000 #000 #333',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center'
                }}>
                    <div style={{textAlign: 'center'}}>
                        <span style={{display: 'block', fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem', color: '#888', marginBottom: '8px'}}>SALDO DISPONÍVEL</span>
                        <span style={{fontFamily: "'Press Start 2P', monospace", fontSize: '1.5rem', color: team.balance > 0 ? '#4ADE80' : '#F87171', textShadow: '3px 3px 0 #000'}}>
                            R$ {(team.balance / 1000000).toFixed(1)}M
                        </span>
                    </div>
                    <div style={{textAlign: 'center'}}>
                        <span style={{display: 'block', fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem', color: '#888', marginBottom: '8px'}}>ELENCO</span>
                        <span style={{fontFamily: "'Press Start 2P', monospace", fontSize: '1.5rem', color: '#FFF', textShadow: '3px 3px 0 #000'}}>
                            {team.squad.length}
                        </span>
                    </div>
                </div>

                {log && (
                    <div className="ef-anim-pulse-glow" onClick={() => setLog('')} style={{
                        background: '#064E3B', border: '4px solid #10B981', color: '#FFF', padding: '12px',
                        fontFamily: "'Press Start 2P', monospace", fontSize: '0.7rem', textAlign: 'center',
                        cursor: 'pointer', boxShadow: '0 8px 0 rgba(0,0,0,0.8)'
                    }}>
                        {log}
                    </div>
                )}

                {/* TAB SELECTORS */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <EfButton variant={tab === 'buy' ? 'primary' : 'secondary'} size="lg" onClick={() => setTab('buy')} style={{flex: 1}}>COMPRAR</EfButton>
                    <EfButton variant={tab === 'sell' ? 'primary' : 'secondary'} size="lg" onClick={() => setTab('sell')} style={{flex: 1}}>VENDER</EfButton>
                    <EfButton variant={tab === 'scout' ? 'primary' : 'secondary'} size="lg" onClick={() => setTab('scout')} style={{flex: 1}}>SCOUTING</EfButton>
                </div>

                {/* === BUY TAB === */}
                {tab === 'buy' && (
                    <MarketPanel title="JOGADORES DISPONÍVEIS">
                        <div style={{display:'flex',gap:'8px',marginBottom:'16px',flexWrap:'wrap'}}>
                            <input
                                type="text"
                                placeholder="NOME DO JOGADOR..."
                                value={marketSearch}
                                onChange={(e) => setMarketSearch(e.target.value)}
                                style={{flex:1, padding:'12px', background:'#111', border:'4px solid', borderColor:'#333 #000 #000 #333', color:'#FFF', fontFamily: "'Press Start 2P', monospace", fontSize:'0.6rem', outline:'none'}}
                            />
                            <select value={marketFilter} onChange={(e) => setMarketFilter(e.target.value)} style={{padding:'12px', background:'#111', border:'4px solid', borderColor:'#333 #000 #000 #333', color:'#FFF', fontFamily: "'Press Start 2P', monospace", fontSize:'0.6rem', outline:'none', appearance: 'none'}}>
                                <option value="all">TODAS POS</option>
                                <option value="GOL">GOL</option>
                                <option value="DEF">DEF</option>
                                <option value="MEI">MEI</option>
                                <option value="ATA">ATA</option>
                            </select>
                            <select value={marketSort} onChange={(e) => setMarketSort(e.target.value)} style={{padding:'12px', background:'#111', border:'4px solid', borderColor:'#333 #000 #000 #333', color:'#FFF', fontFamily: "'Press Start 2P', monospace", fontSize:'0.6rem', outline:'none', appearance: 'none'}}>
                                <option value="ovr">MAIOR OVR</option>
                                <option value="price">MAIOR PREÇO</option>
                                <option value="age">MAIS VELHO</option>
                                <option value="name">A-Z</option>
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
                                price: (a, b) => (b.value || 0) - (a.value || 0),
                                age: (a, b) => b.age - a.age,
                                name: (a, b) => a.name.localeCompare(b.name)
                            };
                            market.sort(sorts[marketSort] || sorts.ovr);
                            return (
                                <>
                                    {market.length === 0 ? (
                                        <div style={{background: '#111', padding: '32px', textAlign: 'center', border: '4px dashed #333', color: '#888'}}>
                                            NENHUM JOGADOR ENCONTRADO.
                                        </div>
                                    ) : (
                                        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                                            {market.map(p => (
                                                <div key={p.id} className="ef-anim-fade-in" style={{
                                                    display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px',
                                                    background: '#111', border: '4px solid', borderColor: '#333 #000 #000 #333',
                                                    borderLeftColor: p.ovr >= 80 ? '#FFD700' : '#333'
                                                }}>
                                                    <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                                                        <PlayerAvatar name={p.name} size={32} />
                                                        <div>
                                                            <div style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.8rem', color: '#FFF', marginBottom: '6px'}}>{p.name.toUpperCase()}</div>
                                                            <div style={{fontSize: '0.8rem', color: '#888'}}>
                                                                <span style={{color: '#FFF', background: '#333', padding: '2px 4px'}}>{p.position}</span>
                                                                <span style={{marginLeft: '8px'}}>OVR <strong style={{color: p.ovr >= 80 ? '#FFD700' : '#FFF'}}>{p.ovr}</strong></span>
                                                                <span style={{marginLeft: '8px'}}>{p.age} ANOS</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
                                                        <span style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.9rem', color: '#4ADE80'}}>
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
                    </MarketPanel>
                )}

                {/* === SELL TAB === */}
                {tab === 'sell' && (
                    <MarketPanel title="SEU ELENCO (VENDÁVEIS)">
                        {sellable.length === 0 ? (
                            <div style={{background: '#111', padding: '32px', textAlign: 'center', border: '4px dashed #333', color: '#888'}}>
                                NENHUM JOGADOR VENDÁVEL. TIRE-OS DA TITULARIDADE PRIMEIRO.
                            </div>
                        ) : (
                            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                                {sellable.sort((a,b) => b.ovr - a.ovr).map(p => (
                                    <div key={p.id} style={{
                                        display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px',
                                        background: '#111', border: '4px solid', borderColor: '#333 #000 #000 #333'
                                    }}>
                                        <div>
                                            <div style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.8rem', color: '#FFF', marginBottom: '6px'}}>{p.name.toUpperCase()}</div>
                                            <div style={{fontSize: '0.8rem', color: '#888'}}>
                                                <span style={{color: '#FFF', background: '#333', padding: '2px 4px'}}>{p.position}</span>
                                                <span style={{marginLeft: '8px'}}>OVR <strong style={{color: '#FFF'}}>{p.ovr}</strong></span>
                                                <span style={{marginLeft: '8px'}}>{p.age} ANOS</span>
                                            </div>
                                        </div>
                                        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
                                            <span style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.8rem', color: '#4ADE80'}}>
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
                                marginTop: '16px', padding: '16px',
                                background: '#3D280B', border: '4px solid #F59E0B',
                                boxShadow: '0 8px 0 rgba(0,0,0,0.8)'
                            }}>
                                <p style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.7rem', color: '#FFD700', marginBottom: '12px'}}>{negotiation.msg}</p>
                                <p style={{fontFamily: "'Press Start 2P', monospace", fontSize: '1.2rem', color: '#FFF', marginBottom: '16px'}}>R$ {(negotiation.counterAmount / 1000000).toFixed(1)}M</p>
                                <div style={{display:'flex',gap:'8px'}}>
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
                                                msg: `CONTRA-PROPOSTA: R$ ${(newAmount / 1000000).toFixed(1)}M (TENTATIVA ${negotiation.round + 2}/3)`,
                                            });
                                        }
                                    }}>PEDIR MAIS</EfButton>
                                    <EfButton variant="danger" size="md" onClick={() => setNegotiation(null)}>CANCELAR</EfButton>
                                </div>
                            </div>
                        )}
                    </MarketPanel>
                )}

                {/* === SCOUT TAB === */}
                {tab === 'scout' && (
                    <MarketPanel title="AGÊNCIA DE SCOUTING (OLHEIROS)">
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px'}}>
                            {SCOUT_REGIONS.map(r => (
                                <EfButton key={r.id} variant="secondary" size="lg" onClick={() => handleScout(r.id)} style={{justifyContent: 'flex-start', padding: '16px'}}>
                                    <span style={{fontSize: '1.5rem', marginRight: '12px'}}>{r.emoji}</span>
                                    <div style={{textAlign: 'left'}}>
                                        <div style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem', color: '#FFF', marginBottom: '4px'}}>{r.name.toUpperCase()}</div>
                                        <div style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem', color: '#F59E0B'}}>CUSTO: R$ {(r.cost/1000).toFixed(0)}K</div>
                                    </div>
                                </EfButton>
                            ))}
                        </div>
                        {engine.scoutedPlayers?.length > 0 && (
                            <div style={{marginTop:'24px'}}>
                                <h4 style={{fontFamily: "'Press Start 2P', monospace", fontSize:'0.7rem', color:'#FFD700', marginBottom:'12px'}}>JOGADORES ENCONTRADOS</h4>
                                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                                    {engine.scoutedPlayers.map((p, i) => (
                                        <div key={i} className="ef-anim-fade-in" style={{
                                            display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px',
                                            background: '#111', border: '4px solid', borderColor: '#333 #000 #000 #333'
                                        }}>
                                            <div>
                                                <div style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.8rem', color: '#FFF', marginBottom: '6px'}}>{p.name.toUpperCase()}</div>
                                                <div style={{fontSize: '0.8rem', color: '#888'}}>
                                                    <span style={{color: '#FFF', background: '#333', padding: '2px 4px'}}>{p.position}</span>
                                                    <span style={{marginLeft: '8px'}}>OVR <strong style={{color: p.ovr >= 80 ? '#FFD700' : '#FFF'}}>{p.ovr}</strong></span>
                                                    <span style={{marginLeft: '8px'}}>{p.age} ANOS</span>
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
                    </MarketPanel>
                )}
            </div>
        </div>
    );
}
