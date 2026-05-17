/**
 * CosmeticShopService — SPEC-101
 *
 * Achievement points → cosmetic unlocks.
 * No gameplay impact, only visual.
 */

import { COSMETIC } from '../engine/EmojiConstants.js';

const STORAGE_KEY = 'olefut_cosmetics';

export const COSMETICS = [
    { id: 'kit_classic',  type: 'kit',     name: 'Kit Classico SNES',  cost: 50,  emoji: COSMETIC.SHIRT },
    { id: 'kit_neon',     type: 'kit',     name: 'Kit Neon Retro',     cost: 100, emoji: COSMETIC.RAINBOW },
    { id: 'kit_gold',     type: 'kit',     name: 'Kit Dourado Pacaembu', cost: 200, emoji: COSMETIC.FLEUR },
    { id: 'badge_skull',  type: 'badge',   name: 'Badge Caveira',      cost: 75,  emoji: COSMETIC.SKULL },
    { id: 'badge_crown',  type: 'badge',   name: 'Badge Coroa',        cost: 150, emoji: COSMETIC.CROWN },
    { id: 'portrait_pro', type: 'portrait', name: 'Manager Profissional', cost: 100, emoji: COSMETIC.SUIT },
    { id: 'portrait_zen', type: 'portrait', name: 'Manager Zen',        cost: 100, emoji: COSMETIC.ZEN },
    { id: 'portrait_punk', type: 'portrait', name: 'Manager Punk',      cost: 150, emoji: COSMETIC.ROCK },
    { id: 'stadium_grass_diamond', type: 'pitch', name: 'Grama Diamante', cost: 80, emoji: COSMETIC.GRASS },
    { id: 'stadium_grass_spiral', type: 'pitch', name: 'Grama Espiral',  cost: 120, emoji: COSMETIC.SPIRAL },
    { id: 'banner_flag', type: 'banner',  name: 'Bandeira Especial',  cost: 60,  emoji: COSMETIC.FLAG },
    { id: 'banner_fireworks', type: 'banner', name: 'Fogos Celebracao', cost: 200, emoji: COSMETIC.FIREWORKS }
];

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : { owned: [], equipped: {}, points: 0 };
    } catch {
        return { owned: [], equipped: {}, points: 0 };
    }
}

function saveState(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function getCosmeticState() {
    return loadState();
}

export function getAchievementPoints(engine) {
    // Sum from achievements unlocked
    if (!engine?.achievements) {
        // Fallback: derive from legacy/stats
        return loadState().points || 0;
    }
    return engine.achievements.points?.get?.(engine.manager?.teamId) || 0;
}

export function purchaseCosmetic(cosmeticId, currentPoints) {
    const state = loadState();
    const item = COSMETICS.find(c => c.id === cosmeticId);
    if (!item) return { success: false, msg: 'Item inválido' };
    if (state.owned.includes(cosmeticId)) return { success: false, msg: 'Já possui' };
    if (currentPoints < item.cost) return { success: false, msg: `Precisa ${item.cost} pontos` };

    state.owned.push(cosmeticId);
    state.points = currentPoints - item.cost;
    saveState(state);
    return { success: true, msg: `${item.name} adquirido.` };
}

export function equipCosmetic(cosmeticId) {
    const state = loadState();
    if (!state.owned.includes(cosmeticId)) return { success: false, msg: 'Item não adquirido.' };
    const item = COSMETICS.find(c => c.id === cosmeticId);
    if (!item) return { success: false, msg: 'Item não encontrado.' };
    state.equipped[item.type] = cosmeticId;
    saveState(state);
    return { success: true, msg: `${item.name} equipado.` };
}
