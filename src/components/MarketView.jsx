import { useState, useMemo, useCallback } from 'react';
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
    const [tab, setTab] = useState('buy');
    const [log, setLog] = useState('');
    const [negotiation, setNegotiation] = useState(null); // {playerId, round, counterAmount}
    // P1-8/9: filter + search Mercado
    const [marketFilter, setMarketFilter] = useState('all'); // pos
    const [marketSort, setMarketSort] = useState('ovr'); // ovr | price | age | name
    const [marketSearch, setMarketSearch] = useState('');

    const engine = getEngine();
    const team = engine.getTeam(gameState.teamId);

    // SPEC-169 (Bloco 3.3): handlers memoizados — referência estável
    // entre renders evita re-renders desnecessários em EfButtons leaf.
    // Mandamento #2: engine é mutável por design (ref instance), UI usa
    // forceUpdate pra invalidar after-mutation. react-hooks/immutability
    // não captura essa intenção — silenciado especificamente neste handler.
    /* eslint-disable react-hooks/immutability */
    const handleBuy = useCallback((player) => {
        if (!team || team.balance < player.value) return;
        const idx = engine.marketPlayers.findIndex(p => p.id === player.id);
        if (idx === -1) return;
        team.balance -= player.value;
        player.contract = { weeksLeft: 76, salary: Math.floor(player.value * 0.001) };
        player.moral = 60;
        player.energy = 100;
        team.squad.push({ ...player, isTitular: false });
        engine.marketPlayers.splice(idx, 1);
        setLog(`CONTRATADO: ${player.name} (R$ ${(player.value / 1000000).toFixed(1)}M)`);
        forceUpdate();
    }, [engine, team, forceUpdate]);
    /* eslint-enable react-hooks/immutability */

    const handleSell = useCallback((player) => {
        const value = player.ovr * 100000;
        setNegotiation({ player, round: 0, counterAmount: value, msg: `VALOR DE MERCADO: R$ ${(value / 1000000).toFixed(1)}M. DESEJA VENDER?` });
    }, []);

    const confirmSell = useCallback(() => {
        if (!negotiation) return;
        const p = negotiation.player;
        const result = engine.sellPlayer(p.id, negotiation.counterAmount);
        setLog(result.msg.toUpperCase());
        setNegotiation(null);
        forceUpdate();
    }, [engine, negotiation, forceUpdate]);

    const handleScout = useCallback((regionId) => {
        const result = engine.scoutRegionAction(regionId);
        setLog(result.msg.toUpperCase() || `SCOUT: ENCONTRADOS ${result.players?.length || 0} JOGADORES!`);
        forceUpdate();
    }, [engine, forceUpdate]);

    // SPEC-169: filter+sort do mercado memoizado.
    // Antes: IIFE re-executava a cada render (search digit, tab click, etc).
    // marketPlayers pode ter dezenas/centenas de itens — sort O(n log n) por
    // keystroke era desperdício. Agora só recalcula quando filtro/busca muda.
    const filteredMarket = useMemo(() => {
        const sorts = {
            ovr: (a, b) => b.ovr - a.ovr,
            price: (a, b) => (b.value || 0) - (a.value || 0),
            age: (a, b) => b.age - a.age,
            name: (a, b) => a.name.localeCompare(b.name)
        };
        let market = [...(engine.marketPlayers || [])];
        if (marketFilter !== 'all') market = market.filter(p => p.position === marketFilter);
        if (marketSearch.trim()) {
            const q = marketSearch.toLowerCase();
            market = market.filter(p => p.name.toLowerCase().includes(q));
        }
        market.sort(sorts[marketSort] || sorts.ovr);
        return market;
    }, [engine.marketPlayers, marketFilter, marketSearch, marketSort]);

    // SPEC-169: sellable list memoizado por mesmo motivo.
    const sellable = useMemo(() => {
        if (!team) return [];
        return team.squad
            .filter(p => !p.isTitular && !p.injury)
            .sort((a, b) => b.ovr - a.ovr);
    }, [team]);

    if (!team) return null;


    return (
        <div className="ef-anim-fade-in ef-layout-pitch" style={{ backgroundImage: `url(${bgOffice})` }}>
            <div className="ef-layout-container" style={{ maxWidth: '1100px' }}>

                {/* HEADER HERO */}
                <EfPanel variant="elev" padding="md" className="ef-flex-row" style={{ justifyContent: 'space-between' }}>
                    <div className="ef-flex-row">
                        <EfClubBadge name={team.name} size="md" />
                        <div>
                            <h2 className="ef-sans ef-text-main" style={{ margin: 0, fontSize: '1.4rem' }}>
                                Mercado de Transferências
                            </h2>
                            <div className="ef-mono ef-text-muted" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                DIRETORIA FINANCEIRA
                            </div>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>SAIR</EfButton>
                </EfPanel>

                {/* FINANCES BENTO */}
                <EfPanel variant="sunk" padding="md" className="ef-flex-row" style={{ justifyContent: 'space-around' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div className="ef-mono ef-text-muted" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                            <Bank size={16} /> SALDO DISPONÍVEL
                        </div>
                        <div className={`ef-mono ${team.balance > 0 ? 'ef-text-primary' : 'ef-text-danger'}`} style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                            R$ {(team.balance / 1000000).toFixed(1)}M
                        </div>
                    </div>
                    <div style={{ width: '2px', background: 'var(--border-panel)', alignSelf: 'stretch' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div className="ef-mono ef-text-muted" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                            <Users size={16} /> ELENCO
                        </div>
                        <div className="ef-mono ef-text-main" style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                            {team.squad.length}
                        </div>
                    </div>
                </EfPanel>

                {/* NOTIFICATION LOG */}
                {log && (
                    <div className="ef-anim-pulse-glow ef-toast-success" onClick={() => setLog('')}>
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
                        <div className="ef-mono ef-text-main" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
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
                                    className="ef-mono"
                                    style={{
                                        width: '100%', padding: '12px 12px 12px 36px',
                                        background: 'var(--bg-sunk)', border: '2px solid var(--border-panel)',
                                        color: 'var(--text-main)', fontSize: '0.8rem', outline: 'none',
                                        }}
                                />
                            </div>
                            <div style={{ display: 'flex', position: 'relative', width: '160px' }}>
                                <Funnel size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                <select value={marketFilter} onChange={(e) => setMarketFilter(e.target.value)} className="ef-mono" style={{
                                    width: '100%', padding: '12px 12px 12px 36px',
                                    background: 'var(--bg-sunk)', border: '2px solid var(--border-panel)',
                                    color: 'var(--text-main)', fontSize: '0.8rem', outline: 'none', appearance: 'none',
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
                                <select value={marketSort} onChange={(e) => setMarketSort(e.target.value)} className="ef-mono" style={{
                                    width: '100%', padding: '12px 12px 12px 36px',
                                    background: 'var(--bg-sunk)', border: '2px solid var(--border-panel)',
                                    color: 'var(--text-main)', fontSize: '0.8rem', outline: 'none', appearance: 'none',
                                    }}>
                                    <option value="ovr">MAIOR OVR</option>
                                    <option value="price">MAIOR PREÇO</option>
                                    <option value="age">MAIS VELHO</option>
                                    <option value="name">A-Z</option>
                                </select>
                            </div>
                        </div>

                        {filteredMarket.length === 0 ? (
                            <div className="ef-empty-state">
                                NENHUM JOGADOR ENCONTRADO.
                            </div>
                        ) : (
                            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                                {filteredMarket.map(p => (
                                    <div key={p.id} className={`ef-anim-fade-in ef-list-row ${p.ovr >= 80 ? 'ef-list-row--accent' : 'ef-list-row--neutral'}`}>
                                                    <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                                                        <PlayerAvatar name={p.name} size={40} />
                                                        <div>
                                                            <div className="ef-player-name">
                                                                {p.name.toUpperCase()}
                                                            </div>
                                                            <div className="ef-player-meta">
                                                                <span className="ef-pos-badge">{p.position}</span>
                                                                <span>OVR <strong className={p.ovr >= 80 ? 'ef-text-accent' : 'ef-text-main'}>{p.ovr}</strong></span>
                                                                <span>•</span>
                                                                <span>{p.age} ANOS</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display:'flex', alignItems:'center', gap:'24px' }}>
                                                        <span className="ef-mono ef-text-primary" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                            R$ {(p.value / 1000000).toFixed(1)}M
                                                        </span>
                                                        <EfButton variant="primary" size="md" title={`Compra ${p.name} por R$ ${(p.value / 1000000).toFixed(1)}M (debita do caixa, gera salário semanal)`} onClick={() => handleBuy(p)} disabled={team.balance < p.value}>
                                                            COMPRAR
                                                        </EfButton>
                                                    </div>
                                                </div>
                                ))}
                            </div>
                        )}
                    </EfPanel>
                )}

                {/* === SELL TAB === */}
                {tab === 'sell' && (
                    <EfPanel variant="default" padding="md">
                        <div className="ef-mono ef-text-main" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                            <Handshake size={20} color="var(--accent)" /> SEU ELENCO (VENDÁVEIS)
                        </div>

                        {sellable.length === 0 ? (
                            <div className="ef-empty-state">
                                NENHUM JOGADOR VENDÁVEL. TIRE-OS DA TITULARIDADE PRIMEIRO.
                            </div>
                        ) : (
                            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                                {sellable.map(p => (
                                    <div key={p.id} className="ef-list-row">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <PlayerAvatar name={p.name} size={40} />
                                            <div>
                                                <div className="ef-player-name">
                                                    {p.name.toUpperCase()}
                                                </div>
                                                <div className="ef-player-meta">
                                                    <span className="ef-pos-badge">{p.position}</span>
                                                    <span>OVR <strong className="ef-text-main">{p.ovr}</strong></span>
                                                    <span>•</span>
                                                    <span>{p.age} ANOS</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display:'flex', alignItems:'center', gap:'24px' }}>
                                            <span className="ef-mono ef-text-primary" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                ~R$ {((p.ovr * 100000) / 1000000).toFixed(1)}M
                                            </span>
                                            <EfButton variant="danger" size="md" title="Inicia negociação de venda (3 rodadas; comprador pode pedir desconto, jogador sai do plantel se fechar)" onClick={() => handleSell(p)}>VENDER</EfButton>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {negotiation && (
                            <div className="ef-anim-fade-in" style={{
                                marginTop: '16px', padding: '24px',
                                background: '#2E1A05', border: '2px solid var(--accent)',
                                }}>
                                <div className="ef-mono ef-text-accent" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.75rem' }}>
                                    <Handshake size={16} /> {negotiation.msg}
                                </div>
                                <div className="ef-mono ef-text-main" style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '24px' }}>
                                    R$ {(negotiation.counterAmount / 1000000).toFixed(1)}M
                                </div>
                                <div style={{ display:'flex', gap:'8px' }}>
                                    <EfButton variant="primary" size="md" title="Aceitar valor atual e fechar venda (irreversível)" onClick={confirmSell}>ACEITAR</EfButton>
                                    <EfButton variant="secondary" size="md" title="Pedir contra-proposta +15% (máximo 3 tentativas, encerra negociação após)" onClick={() => {
                                        const newAmount = Math.floor(negotiation.counterAmount * 1.15);
                                        if (negotiation.round >= 2) {
                                            setLog('NEGOCIAÇÃO ENCERRADA.');
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
                        <div className="ef-mono ef-text-main" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                            <GlobeHemisphereWest size={20} color="var(--primary)" /> AGÊNCIA DE SCOUTING (OLHEIROS)
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                            {SCOUT_REGIONS.map(r => (
                                <EfButton key={r.id} variant="secondary" size="lg" title={`Manda olheiro para ${r.name} (custo R$ ${(r.cost/1000).toFixed(0)}K, debita do caixa, retorna lista de jogadores)`} onClick={() => handleScout(r.id)} style={{ justifyContent: 'flex-start', padding: '16px', height: 'auto' }}>
                                    {/* r.emoji is semantic data (region flag), not decorative icon — kept per SPEC-163 exception */}
                                    <span aria-hidden="true" style={{ fontSize: '2rem', marginRight: '16px' }}>{r.emoji}</span>
                                    <div style={{ textAlign: 'left' }}>
                                        <div className="ef-sans ef-text-main" style={{ fontWeight: 'bold', marginBottom: '4px' }}>{r.name.toUpperCase()}</div>
                                        <div className="ef-mono ef-text-accent" style={{ fontSize: '0.75rem' }}>CUSTO: R$ {(r.cost/1000).toFixed(0)}K</div>
                                    </div>
                                </EfButton>
                            ))}
                        </div>

                        {engine.scoutedPlayers?.length > 0 && (
                            <div style={{ marginTop:'32px' }}>
                                <div className="ef-mono ef-text-accent" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                                    <Users size={16} /> JOGADORES ENCONTRADOS
                                </div>
                                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                                    {engine.scoutedPlayers.map((p, i) => (
                                        <div key={i} className="ef-anim-fade-in ef-list-row ef-list-row--primary">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <PlayerAvatar name={p.name} size={40} />
                                                <div>
                                                    <div className="ef-player-name">
                                                        {p.name.toUpperCase()}
                                                    </div>
                                                    <div className="ef-player-meta">
                                                        <span className="ef-pos-badge">{p.position}</span>
                                                        <span>OVR <strong className={p.ovr >= 80 ? 'ef-text-accent' : 'ef-text-main'}>{p.ovr}</strong></span>
                                                        <span>•</span>
                                                        <span>{p.age} ANOS</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <EfButton variant="primary" size="md" title={`Assina ${p.name} direto (debita valor do caixa e gera salário semanal)`} onClick={() => {
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

