// SPEC-015: Market & Transfer System
// Janelas (verão W1-8, inverno W36-39), pré-acordos, oferta/contraoferta.

export const TRANSFER_WINDOWS = {
    summer: { start: 1, end: 8 },
    winter: { start: 36, end: 39 },
};

export function isWindowOpen(weekOfYear) {
    const s = TRANSFER_WINDOWS.summer;
    const w = TRANSFER_WINDOWS.winter;
    return (
        (weekOfYear >= s.start && weekOfYear <= s.end) ||
        (weekOfYear >= w.start && weekOfYear <= w.end)
    );
}

let nextOfferId = 1;

export class MarketSystem {
    constructor() {
        this.listings = new Map(); // playerId → listing
        this.offers = []; // pending offers
        this.transactions = []; // history
    }

    listPlayer({ playerId, askingPrice, weekOfYear, sellingTeamId }) {
        if (!isWindowOpen(weekOfYear)) {
            return { listed: false, reason: 'Window closed' };
        }
        const listing = {
            playerId,
            sellingTeamId,
            askingPrice,
            listed: true,
            weekListed: weekOfYear,
            bids: [],
        };
        this.listings.set(playerId, listing);
        return listing;
    }

    makeOffer({ playerId, offeringTeamId, bidAmount, weekOfYear }) {
        const listing = this.listings.get(playerId);
        // BUG-008 fix: sem listing, oferta inválida
        if (!listing) {
            return { rejected: true, reason: 'Player not listed' };
        }
        const minBid = listing.askingPrice * 0.5;
        if (bidAmount < minBid) {
            return { rejected: true, reason: 'Bid < 50% asking' };
        }
        const inWindow = isWindowOpen(weekOfYear);
        const offer = {
            id: `offer_${nextOfferId++}`,
            playerId,
            offeringTeamId,
            bidAmount,
            weekOffered: weekOfYear,
            pending: !inWindow,
            activateWeek: inWindow ? weekOfYear : 1, // pré-acordo
            status: 'pending',
        };
        this.offers.push(offer);
        if (listing) listing.bids.push(offer);
        return offer;
    }

    calculateDemandPrice(playerId) {
        const listing = this.listings.get(playerId);
        if (!listing) return 0;
        const offerCount = listing.bids.length;
        const demandMul = 1 + Math.max(0, offerCount - 1) * 0.05;
        return listing.askingPrice * demandMul;
    }

    calculateTransferPrice({ ovr = 70, ageFactor = 1.0, contractYears = 3, prestige = 1.0, demand = 0 }) {
        const base = ovr * ageFactor * contractYears;
        return Math.floor(base * (1 + demand) * prestige);
    }

    negotiateCounterOffer(playerId, counterPrice) {
        const listing = this.listings.get(playerId);
        if (!listing) return null;
        const lastOffer = listing.bids[listing.bids.length - 1];
        if (!lastOffer) return null;
        // Counter ≤ original (not raise)
        const finalPrice = Math.min(counterPrice, lastOffer.bidAmount);
        return {
            playerId,
            price: finalPrice,
            week: lastOffer.weekOffered,
            validUntil: lastOffer.weekOffered + 1,
        };
    }

    acceptOffer({ playerId, offeringTeamId, offerPrice, weekOfYear }) {
        const listing = this.listings.get(playerId);
        if (!listing) return null;
        const offer = listing.bids.find(
            (b) => b.offeringTeamId === offeringTeamId
        );
        if (!offer) return null;

        const transaction = {
            playerId,
            fromTeamId: listing.sellingTeamId,
            toTeamId: offeringTeamId,
            transferPrice: offerPrice,
            weekCompleted: weekOfYear,
            playerTransferred: true,
        };
        this.transactions.push(transaction);
        offer.status = 'accepted';
        listing.listed = false;
        return transaction;
    }
}
