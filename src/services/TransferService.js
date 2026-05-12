// AKITA-RFCT-019.2: extract transfer + market generation from engine.
//
// Stateless service. Recebe engine como contexto, muta state in-place
// (preserva comportamento original — golden master idêntico).
//
// Métodos extraídos:
// - generateMarket → preenche engine.marketPlayers
// - acceptTransferOffer → executa venda + side effects (star protection, formerCompanions)
// - rejectTransferOffer → remove oferta da fila
// - makeBuyOffer → oferta humano → outro time (sigmoid acceptance)
// - npcMakeBuyOffer → oferta NPC-NPC (ou NPC→humano via transferOffers fila)
// - sellPlayer → venda direta sem oferta

import { Data } from '../engine/data';
import { rng as systemRng } from '../engine/rng.js';
import { onBoardSellAttempt as checkStarProtection } from '../engine/StarProtectionSystem';
import { apply as applyBoardTension } from '../engine/BoardTensionSystem';

export class TransferService {
    constructor() {
        // Stateless
    }

    /**
     * Preenche engine.marketPlayers com 20 jogadores reais aleatórios.
     */
    generateMarket(engine) {
        engine.marketPlayers = [];
        for (let i = 0; i < 20; i++) {
            const positions = ['GOL', 'DEF', 'MEI', 'ATA'];
            const pos = positions[Math.floor(systemRng() * positions.length)];
            engine.marketPlayers.push(Data.getRandomRealPlayer(pos, 2));
        }
    }

    /**
     * Aceita oferta de transferência. Inclui star protection check + formerCompanions tracking.
     */
    acceptTransferOffer(engine, offerId) {
        const offer = engine.transferOffers.find(o => o.playerId === offerId);
        if (!offer) return { success: false, msg: 'Oferta não encontrada.' };
        const team = engine.getTeam(engine.manager.teamId);
        if (!team) return { success: false, msg: 'Time não encontrado.' };

        // SPEC-075: Star Protection check — board selling protected player → tension spike
        try {
            const starEvent = checkStarProtection({ managerId: engine.manager.teamId, playerId: offerId });
            if (starEvent) {
                const bt = applyBoardTension({ currentTension: engine.boardTension, eventType: 'board_sold_player' });
                engine.boardTension = bt.newTension;
                engine.weekEvents.push(`⚠️ ${starEvent.publicReaction}`);
                if (bt.thresholdChanged && bt.boardMessage) engine.weekEvents.push(`🏛️ ${bt.boardMessage}`);
            }
        } catch { /* defensive */ }

        // Track former companion for FilhosRegen (SPEC-081)
        try {
            const soldPlayer = team.squad.find(p => p.id === offerId);
            if (soldPlayer) {
                engine.formerCompanions.push({
                    playerId: soldPlayer.id,
                    name: soldPlayer.name,
                    primeYear: 2026 + engine.seasonNumber,
                    position: soldPlayer.position,
                    ovr: soldPlayer.ovr || 50,
                    traits: soldPlayer.traits || [],
                });
                // BUG-090: cap to 50 entries to prevent save bloat in long soak tests
                if (engine.formerCompanions.length > 50) {
                    engine.formerCompanions = engine.formerCompanions.slice(-50);
                }
            }
        } catch { /* defensive */ }

        const soldPlayer = team.squad.find(p => p.id === offerId);
        team.squad = team.squad.filter(p => p.id !== offerId);
        team.balance += offer.offerAmount;

        // BUG-083b: Se a oferta veio de um NPC (buyerTeamId), transferir jogador ao NPC
        if (offer.buyerTeamId && soldPlayer) {
            const buyerTeam = engine.getTeam(offer.buyerTeamId);
            if (buyerTeam) {
                soldPlayer.injury = null;
                soldPlayer.energy = 100;
                soldPlayer.isTitular = false;
                soldPlayer.contract = { weeksLeft: 76, salary: Math.floor((offer.offerAmount || 500000) * 0.001) };
                buyerTeam.squad.push(soldPlayer);
                buyerTeam.balance -= offer.offerAmount;
            }
        }

        engine.transferOffers = engine.transferOffers.filter(o => o.playerId !== offerId);
        return { success: true, msg: `${offer.playerName} vendido para ${offer.buyerClub} por R$ ${(offer.offerAmount / 1000000).toFixed(1)}M!` };
    }

    /**
     * Recusa oferta. Apenas remove da fila.
     */
    rejectTransferOffer(engine, offerId) {
        engine.transferOffers = engine.transferOffers.filter(o => o.playerId !== offerId);
        return { success: true, msg: 'Oferta recusada.' };
    }

    /**
     * SPEC-122 BUG-053: Oferta humano → outro time. Sigmoid acceptance.
     * SPEC-125: sigmoid íngreme (ratio <1.0 reject, >1.5 accept).
     */
    makeBuyOffer(engine, otherTeamId, playerId, amount) {
        const myTeam = engine.getTeam(engine.manager?.teamId);
        const otherTeam = engine.getTeam(otherTeamId);
        if (!myTeam || !otherTeam) return { success: false, msg: 'Time não encontrado.', accepted: false };
        if (myTeam.id === otherTeam.id) return { success: false, msg: 'Mesmo time.', accepted: false };
        if ((myTeam.balance || 0) < amount) return { success: false, msg: 'Saldo insuficiente.', accepted: false };
        if ((myTeam.squad || []).length >= 30) return { success: false, msg: 'Squad cheio.', accepted: false };

        const player = otherTeam.squad?.find(p => p.id === playerId);
        if (!player) return { success: false, msg: 'Jogador não encontrado.', accepted: false };

        const ratio = amount / Math.max(1, player.value || 1_000_000);
        const acceptProb = Math.max(0, Math.min(1, (ratio - 1.0) / 0.5));
        const accepted = systemRng() < acceptProb;

        if (!accepted) {
            return {
                success: true,
                accepted: false,
                msg: `${otherTeam.name} recusou oferta R$ ${(amount / 1_000_000).toFixed(1)}M por ${player.name} (esperava ${(ratio * 100).toFixed(0)}% do valor).`,
                ratio,
                acceptProb
            };
        }

        // Transfer execution
        otherTeam.squad = otherTeam.squad.filter(p => p.id !== playerId);
        otherTeam.balance = (otherTeam.balance || 0) + amount;
        myTeam.balance -= amount;
        player.injury = null;
        player.energy = 100;
        player._purchasePrice = amount; // Track for Sunk Cost bias

        // BUG-055 fix: auto-promote to titular if position has <2 starters OR new stronger
        const positionStarters = myTeam.squad.filter(p => p.isTitular && p.position === player.position);
        if (positionStarters.length < 2) {
            player.isTitular = true;
        } else {
            const weakestStarter = positionStarters.sort((a, b) => (a.ovr || 0) - (b.ovr || 0))[0];
            if ((player.ovr || 0) > (weakestStarter.ovr || 0) + 3) {
                weakestStarter.isTitular = false;
                player.isTitular = true;
            } else {
                player.isTitular = false;
            }
        }
        myTeam.squad.push(player);

        return {
            success: true,
            accepted: true,
            msg: `🎉 Comprou ${player.name} de ${otherTeam.name} por R$ ${(amount / 1_000_000).toFixed(1)}M!`,
            ratio,
            playerId
        };
    }

    /**
     * NPC-to-NPC buy offer. Pode também gerar oferta pra humano (BUG-083).
     */
    npcMakeBuyOffer(engine, buyerTeamId, sellerTeamId, playerId, amount) {
        const buyerTeam = engine.getTeam(buyerTeamId);
        const sellerTeam = engine.getTeam(sellerTeamId);
        if (!buyerTeam || !sellerTeam) return { success: false, accepted: false };
        if (buyerTeamId === sellerTeamId) return { success: false, accepted: false };
        if ((buyerTeam.balance || 0) < amount) return { success: false, accepted: false };
        if ((buyerTeam.squad || []).length >= 30) return { success: false, accepted: false };

        const player = sellerTeam.squad?.find(p => p.id === playerId);
        if (!player) return { success: false, accepted: false };

        // BUG-083: Se o seller é o time do jogador humano, gerar oferta para o humano decidir
        if (sellerTeamId === engine.manager?.teamId) {
            engine.transferOffers.push({
                playerId: player.id,
                playerName: player.name,
                offerAmount: amount,
                buyerClub: buyerTeam.name,
                buyerTeamId: buyerTeamId,
                deadline: (engine.currentWeek || 0) + 3
            });
            return { success: true, accepted: false, pendingHuman: true };
        }

        const ratio = amount / Math.max(1, player.value || 1_000_000);
        const acceptProb = Math.max(0, Math.min(1, (ratio - 1.0) / 0.5));
        const accepted = systemRng() < acceptProb;

        if (!accepted) {
            return { success: true, accepted: false, ratio };
        }

        // Execute transfer
        sellerTeam.squad = sellerTeam.squad.filter(p => p.id !== playerId);
        sellerTeam.balance = (sellerTeam.balance || 0) + amount;
        buyerTeam.balance -= amount;
        player.injury = null;
        player.energy = 100;
        player._purchasePrice = amount;

        // Auto-promote if needed
        const positionStarters = buyerTeam.squad.filter(p => p.isTitular && p.position === player.position);
        if (positionStarters.length < 2) {
            player.isTitular = true;
        } else {
            const weakest = positionStarters.sort((a, b) => (a.ovr || 0) - (b.ovr || 0))[0];
            if ((player.ovr || 0) > (weakest.ovr || 0) + 3) {
                weakest.isTitular = false;
                player.isTitular = true;
            } else {
                player.isTitular = false;
            }
        }
        buyerTeam.squad.push(player);

        return { success: true, accepted: true, ratio };
    }

    /**
     * Venda direta do squad humano. Player não pode ser titular.
     */
    sellPlayer(engine, playerId, amount) {
        const team = engine.getTeam(engine.manager.teamId);
        if (!team) return { success: false, msg: 'Time não encontrado.' };
        const player = team.squad.find(p => p.id === playerId);
        if (!player) return { success: false, msg: 'Jogador não encontrado.' };
        if (player.isTitular) return { success: false, msg: 'Tire da titularidade antes de vender.' };
        team.squad = team.squad.filter(p => p.id !== playerId);
        team.balance += amount;
        // SPEC-135: track transfers para view unlock
        engine.viewUnlockState.totalTransfers = (engine.viewUnlockState.totalTransfers || 0) + 1;
        return { success: true, msg: `💰 ${player.name} vendido por R$ ${(amount/1000000).toFixed(1)}M!` };
    }
}
