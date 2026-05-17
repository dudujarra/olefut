/**
 * StarAuctionSystem.js — Leilão de Jogadores Estrela
 *
 * Mecânica clássica do Elifoot: jogadores de alto OVR (Stars, Wonderkids)
 * não são vendidos "na bacia das almas". O mercado abre um LEILÃO onde
 * NPCs competem com o manager humano pelo jogador.
 *
 * Stateless. Recebe dados, retorna estados de leilão.
 *
 * Fluxo:
 * 1. Quando o manager tenta comprar jogador do mercado com OVR >= threshold,
 *    TransferService chama `startAuction()` em vez de compra direta.
 * 2. O leilão dura 1 semana (resolved no próximo advanceWeek).
 * 3. NPCs fazem lances baseados no budget e na necessidade posicional.
 * 4. Se o manager der o maior lance, leva. Senão, perde.
 *
 * engine.activeAuctions = [{ ... }]  (max 1 ativo por vez)
 */

import { rng as systemRng } from './rng.js';

// ============================================================
// CONFIGURAÇÃO
// ============================================================
const AUCTION_OVR_THRESHOLD = 78;    // OVR mínimo para forçar leilão
const AUCTION_DURATION_WEEKS = 2;    // duração em semanas (player gets 1 full week to raiseBid)
const MAX_ACTIVE_AUCTIONS = 1;       // max leilões simultâneos
const AUCTION_MAX_AGE_WEEKS = 5;     // BUG-AUDIT-4: force-expire stale auctions
const NPC_BIDDERS_MIN = 1;
const NPC_BIDDERS_MAX = 3;

/**
 * Verifica se um jogador deve ir a leilão.
 *
 * @param {object} player — jogador alvo
 * @returns {boolean}
 */
export function requiresAuction(player) {
    if (!player) return false;
    const ovr = player.ovr || 0;
    return ovr >= AUCTION_OVR_THRESHOLD || !!player.isSuper || !!player.isWonderkid;
}

/**
 * Inicia um leilão para um jogador.
 *
 * @param {Engine} engine
 * @param {object} player — o jogador sendo leiloado
 * @param {number} managerBid — lance inicial do manager
 * @param {string} source — 'market' (mercado livre) ou 'league' (scoutLeague)
 * @param {number} [sourceTeamId] — teamId do vendedor (se league)
 * @returns {{ success: boolean, msg: string, auction?: object }}
 */
export function startAuction(engine, player, managerBid, source = 'market', sourceTeamId = null) {
    if (!engine.activeAuctions) engine.activeAuctions = [];

    if (engine.activeAuctions.length >= MAX_ACTIVE_AUCTIONS) {
        return {
            success: false,
            msg: `Já existe um leilão ativo. Aguarde a resolução antes de abrir outro.`,
        };
    }

    const team = engine.getTeam(engine.manager.teamId);
    if (!team) return { success: false, msg: 'Time não encontrado.' };
    if ((team.balance || 0) < managerBid) return { success: false, msg: 'Saldo insuficiente para o lance.' };

    const baseValue = player.value || 5_000_000;

    // Gerar lances NPC
    const npcBidderCount = NPC_BIDDERS_MIN + Math.floor(systemRng() * (NPC_BIDDERS_MAX - NPC_BIDDERS_MIN + 1));
    const npcBids = [];

    // Buscar times NPC com budget razoável
    const eligibleNpcs = (engine.teams || [])
        .filter(t => t.id !== engine.manager.teamId && (t.balance || 0) > baseValue * 0.8)
        .sort(() => systemRng() - 0.5)
        .slice(0, npcBidderCount);

    eligibleNpcs.forEach(npcTeam => {
        // NPC bid: 90% a 150% do valor base, capped pelo budget
        const bidFactor = 0.9 + systemRng() * 0.6;
        const rawBid = Math.floor(baseValue * bidFactor);
        const cappedBid = Math.min(rawBid, Math.floor((npcTeam.balance || 0) * 0.4)); // max 40% do budget

        if (cappedBid > baseValue * 0.5) { // min viável
            npcBids.push({
                teamId: npcTeam.id,
                teamName: npcTeam.name,
                bid: cappedBid,
            });
        }
    });

    const auction = {
        id: `auction_s${engine.seasonNumber || 0}w${engine.currentWeek || 0}_${Math.floor(systemRng() * 10000)}`,
        playerId: player.id,
        playerName: player.name,
        playerOvr: player.ovr,
        playerPosition: player.position,
        playerValue: baseValue,
        source,
        sourceTeamId,
        managerBid,
        npcBids,
        weekStarted: engine.currentWeek,
        weekResolves: engine.currentWeek + AUCTION_DURATION_WEEKS,
        resolved: false,
        winner: null,
    };

    engine.activeAuctions.push(auction);

    const competitorNames = npcBids.map(b => b.teamName).join(', ') || 'ninguém (por enquanto)';

    return {
        success: true,
        msg: `🔨 LEILÃO ABERTO! ${player.name} (OVR ${player.ovr}) está em disputa. Seu lance: R$ ${(managerBid / 1_000_000).toFixed(1)}M. Concorrentes: ${competitorNames}. Resultado na próxima semana.`,
        auction,
    };
}

/**
 * Permite ao manager aumentar seu lance em um leilão ativo.
 *
 * @param {Engine} engine
 * @param {string} auctionId
 * @param {number} newBid
 * @returns {{ success: boolean, msg: string }}
 */
export function raiseBid(engine, auctionId, newBid) {
    if (!engine.activeAuctions) return { success: false, msg: 'Sem leilões ativos.' };
    const auction = engine.activeAuctions.find(a => a.id === auctionId);
    if (!auction) return { success: false, msg: 'Leilão não encontrado.' };
    if (auction.resolved) return { success: false, msg: 'Leilão já encerrado.' };

    const team = engine.getTeam(engine.manager.teamId);
    if (!team || (team.balance || 0) < newBid) return { success: false, msg: 'Saldo insuficiente.' };
    if (newBid <= auction.managerBid) return { success: false, msg: 'Novo lance deve ser maior que o atual.' };

    auction.managerBid = newBid;

    // NPCs podem reagir aumentando lance (50% chance)
    auction.npcBids.forEach(npcBid => {
        if (npcBid.bid < newBid && systemRng() < 0.5) {
            const npcTeam = engine.getTeam(npcBid.teamId);
            if (npcTeam) {
                const raiseAmount = Math.floor(newBid * (1.0 + systemRng() * 0.15));
                const cappedRaise = Math.min(raiseAmount, Math.floor((npcTeam.balance || 0) * 0.4));
                if (cappedRaise > npcBid.bid) {
                    npcBid.bid = cappedRaise;
                }
            }
        }
    });

    const highestNpc = auction.npcBids.reduce((max, b) => b.bid > max ? b.bid : max, 0);
    const isWinning = newBid >= highestNpc;

    return {
        success: true,
        msg: `Lance aumentado para R$ ${(newBid / 1_000_000).toFixed(1)}M. ${isWinning ? '✅ Você está vencendo!' : '⚠️ Há lances maiores. Aumente!'}`,
    };
}

/**
 * Resolve leilões cujo prazo expirou.
 * Chamado pelo WeekProcessor no advanceWeek.
 *
 * @param {Engine} engine
 * @returns {Array<{ auctionId: string, won: boolean, msg: string }>}
 */
export function resolveAuctions(engine) {
    if (!engine.activeAuctions || engine.activeAuctions.length === 0) return [];

    const results = [];
    const toRemove = [];

    engine.activeAuctions.forEach(auction => {
        if (auction.resolved || engine.currentWeek < auction.weekResolves) return;

        // Determinar vencedor
        const highestNpc = auction.npcBids.reduce(
            (best, b) => (b.bid > (best?.bid || 0)) ? b : best,
            null
        );

        const managerWins = !highestNpc || auction.managerBid >= highestNpc.bid;

        if (managerWins) {
            // Manager venceu o leilão
            const team = engine.getTeam(engine.manager.teamId);
            if (team && (team.balance || 0) >= auction.managerBid) {
                auction.resolved = true;
                auction.winner = 'manager';

                results.push({
                    auctionId: auction.id,
                    won: true,
                    playerId: auction.playerId,
                    playerName: auction.playerName,
                    bid: auction.managerBid,
                    source: auction.source,
                    sourceTeamId: auction.sourceTeamId,
                    msg: `🏆 LEILÃO VENCIDO! ${auction.playerName} é seu por R$ ${(auction.managerBid / 1_000_000).toFixed(1)}M!`,
                });
            } else {
                // Manager sem saldo — NPC leva
                auction.resolved = true;
                auction.winner = highestNpc?.teamName || 'ninguém';
                results.push({
                    auctionId: auction.id,
                    won: false,
                    msg: `❌ Saldo insuficiente para honrar lance. ${auction.playerName} perdido.`,
                });
            }
        } else {
            // NPC venceu
            auction.resolved = true;
            auction.winner = highestNpc.teamName;

            // Transferir para o NPC vencedor
            const npcTeam = engine.getTeam(highestNpc.teamId);
            if (npcTeam && auction.source === 'market') {
                // Remover do mercado e adicionar ao NPC
                const playerInMarket = (engine.marketPlayers || []).find(p => p.id === auction.playerId);
                if (playerInMarket) {
                    engine.marketPlayers = engine.marketPlayers.filter(p => p.id !== auction.playerId);
                    playerInMarket.isTitular = false;
                    playerInMarket.energy = 100;
                    npcTeam.squad.push(playerInMarket);
                    npcTeam.balance -= highestNpc.bid;
                }
            }

            results.push({
                auctionId: auction.id,
                won: false,
                playerName: auction.playerName,
                msg: `😤 LEILÃO PERDIDO! ${highestNpc.teamName} levou ${auction.playerName} por R$ ${(highestNpc.bid / 1_000_000).toFixed(1)}M. Seu lance: R$ ${(auction.managerBid / 1_000_000).toFixed(1)}M.`,
            });
        }

        toRemove.push(auction.id);
    });

    // Limpar leilões resolvidos
    engine.activeAuctions = engine.activeAuctions.filter(a => !toRemove.includes(a.id));

    // BUG-AUDIT-4: Force-expire stale auctions (safety net for soak tests)
    engine.activeAuctions = engine.activeAuctions.filter(a =>
        (engine.currentWeek - (a.weekStarted || 0)) < AUCTION_MAX_AGE_WEEKS
    );

    return results;
}

/**
 * Retorna leilões ativos para a UI.
 * @param {Engine} engine
 * @returns {Array}
 */
export function getActiveAuctions(engine) {
    return (engine.activeAuctions || []).filter(a => !a.resolved);
}
