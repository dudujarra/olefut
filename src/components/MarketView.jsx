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
import '../styles/market-view.css';

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
            <div className="ef-layout-container ef-market__container">

                {/* HEADER HERO */}
                <EfPanel variant="elev" padding="md" className="ef-flex-row ef-market__header">
                    <div className="ef-flex-row ef-market__header-left">
                        <EfClubBadge name={team.name} size="md" />
                        <div>
                            <h2 className="ef-sans ef-text-main ef-market__title">
                                Mercado de Transferências
                            </h2>
                            <div className="ef-mono ef-market__subtitle">
                                DIRETORIA FINANCEIRA
                            </div>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>SAIR</EfButton>
                </EfPanel>

                {/* FINANCES BENTO */}
                <EfPanel variant="sunk" padding="md" className="ef-market__finances">
                    <div className="ef-market__finance-cell">
                        <div className="ef-market__finance-label">
                            <Bank size={16} /> SALDO DISPONÍVEL
                        </div>
                        <div className={`ef-mono ef-market__finance-value ${team.balance > 0 ? 'ef-market__finance-value--positive' : 'ef-market__finance-value--negative'}`}>
                            R$ {(team.balance / 1000000).toFixed(1)}M
                        </div>
                    </div>
                    <div className="ef-market__finance-divider" />
                    <div className="ef-market__finance-cell">
                        <div className="ef-market__finance-label">
                            <Users size={16} /> ELENCO
                        </div>
                        <div className="ef-mono ef-market__finance-value">
                            {team.squad.length}
                        </div>
                    </div>
                </EfPanel>

                {/* NOTIFICATION LOG */}
                {log && (
                    <div className="ef-anim-pulse-glow ef-toast-success" onClick={() => setLog('')}>
                        <CheckCircle size={20} weight="fill" color="var(--color-emerald-confirm)" />
                        {log}
                    </div>
                )}

                {/* TAB SELECTORS */}
                <div className="ef-market__tabs">
                    <EfButton className="ef-market__tab-button" variant={tab === 'buy' ? 'primary' : 'secondary'} size="lg" onClick={() => setTab('buy')}>
                        <ShoppingCart size={20} /> COMPRAR
                    </EfButton>
                    <EfButton className="ef-market__tab-button" variant={tab === 'sell' ? 'primary' : 'secondary'} size="lg" onClick={() => setTab('sell')}>
                        <CurrencyDollar size={20} /> VENDER
                    </EfButton>
                    <EfButton className="ef-market__tab-button" variant={tab === 'scout' ? 'primary' : 'secondary'} size="lg" onClick={() => setTab('scout')}>
                        <GlobeHemisphereWest size={20} /> SCOUTING
                    </EfButton>
                </div>

                {/* === BUY TAB === */}
                {tab === 'buy' && (
                    <EfPanel variant="default" padding="md">
                        <div className="ef-market__section-title">
                            <Storefront size={20} /> JOGADORES DISPONÍVEIS
                        </div>

                        <div className="ef-market__search-bar">
                            <div className="ef-market__search-input-wrapper">
                                <MagnifyingGlass size={16} className="ef-market__search-input-icon" />
                                <input
                                    type="text"
                                    placeholder="NOME DO JOGADOR..."
                                    value={marketSearch}
                                    onChange={(e) => setMarketSearch(e.target.value)}
                                    className="ef-mono ef-market__search-input"
                                />
                            </div>
                            <div className="ef-market__filter-wrapper">
                                <Funnel size={16} className="ef-market__filter-icon" />
                                <select value={marketFilter} onChange={(e) => setMarketFilter(e.target.value)} className="ef-mono ef-market__filter-select">
                                    <option value="all">TODAS POS</option>
                                    <option value="GOL">GOL</option>
                                    <option value="DEF">DEF</option>
                                    <option value="MEI">MEI</option>
                                    <option value="ATA">ATA</option>
                                </select>
                            </div>
                            <div className="ef-market__sort-wrapper">
                                <ChartLineUp size={16} className="ef-market__sort-icon" />
                                <select value={marketSort} onChange={(e) => setMarketSort(e.target.value)} className="ef-mono ef-market__sort-select">
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
                            <div className="ef-market__list">
                                {filteredMarket.map(p => (
                                    <div key={p.id} className={`ef-anim-fade-in ef-list-row ${p.ovr >= 80 ? 'ef-list-row--accent' : 'ef-list-row--neutral'}`}>
                                        <div className="ef-market__player-info">
                                            <PlayerAvatar name={p.name} size={40} />
                                            <div className="ef-market__player-details">
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
                                        <div className="ef-market__player-price">
                                            <span className="ef-market__price-amount">
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
                        <div className="ef-market__section-title">
                            <Handshake size={20} /> SEU ELENCO (VENDÁVEIS)
                        </div>

                        {sellable.length === 0 ? (
                            <div className="ef-empty-state">
                                NENHUM JOGADOR VENDÁVEL. TIRE-OS DA TITULARIDADE PRIMEIRO.
                            </div>
                        ) : (
                            <div className="ef-market__list">
                                {sellable.map(p => (
                                    <div key={p.id} className="ef-list-row">
                                        <div className="ef-market__player-info">
                                            <PlayerAvatar name={p.name} size={40} />
                                            <div className="ef-market__player-details">
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
                                        <div className="ef-market__player-price">
                                            <span className="ef-market__price-amount">
                                                ~R$ {((p.ovr * 100000) / 1000000).toFixed(1)}M
                                            </span>
                                            <EfButton variant="danger" size="md" title="Inicia negociação de venda (3 rodadas; comprador pode pedir desconto, jogador sai do plantel se fechar)" onClick={() => handleSell(p)}>VENDER</EfButton>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {negotiation && (
                            <div className="ef-anim-fade-in ef-market__negotiation-panel">
                                <div className="ef-market__negotiation-msg">
                                    <Handshake size={16} /> {negotiation.msg}
                                </div>
                                <div className="ef-market__negotiation-amount">
                                    R$ {(negotiation.counterAmount / 1000000).toFixed(1)}M
                                </div>
                                <div className="ef-market__negotiation-actions">
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
                        <div className="ef-market__section-title">
                            <GlobeHemisphereWest size={20} /> AGÊNCIA DE SCOUTING (OLHEIROS)
                        </div>
                        <div className="ef-market__scout-grid">
                            {SCOUT_REGIONS.map(r => (
                                <EfButton key={r.id} className="ef-market__scout-button" variant="secondary" size="lg" title={`Manda olheiro para ${r.name} (custo R$ ${(r.cost/1000).toFixed(0)}K, debita do caixa, retorna lista de jogadores)`} onClick={() => handleScout(r.id)}>
                                    {/* r.emoji is semantic data (region flag), not decorative icon — kept per SPEC-163 exception */}
                                    <span className="ef-market__scout-emoji" aria-hidden="true">{r.emoji}</span>
                                    <div className="ef-market__scout-info">
                                        <div className="ef-sans ef-market__scout-region-name">{r.name.toUpperCase()}</div>
                                        <div className="ef-mono ef-market__scout-cost">CUSTO: R$ {(r.cost/1000).toFixed(0)}K</div>
                                    </div>
                                </EfButton>
                            ))}
                        </div>

                        {engine.scoutedPlayers?.length > 0 && (
                            <div className="ef-market__scouted-section">
                                <div className="ef-market__scouted-title">
                                    <Users size={16} /> JOGADORES ENCONTRADOS
                                </div>
                                <div className="ef-market__scouted-list">
                                    {engine.scoutedPlayers.map((p, i) => (
                                        <div key={i} className="ef-anim-fade-in ef-list-row ef-list-row--primary">
                                            <div className="ef-market__player-info">
                                                <PlayerAvatar name={p.name} size={40} />
                                                <div className="ef-market__player-details">
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

