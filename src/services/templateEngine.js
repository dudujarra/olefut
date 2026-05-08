/**
 * Template Engine — JS puro (NÃO Tracery, NÃO LLM)
 *
 * SPEC-049: gera manchete substituindo slots {chave} pelo valor de ctx[chave].
 * Slot ausente vira "[chave]" para debugging.
 *
 * Usage:
 *   import { pickHeadline } from './templateEngine';
 *   const headline = pickHeadline('traicao', ctx, rng);
 */

import * as headlines from '../data/headlines';

/**
 * Pick a random headline from a category and fill slots.
 *
 * @param {string} category — categoria existente em headlines/index.js
 * @param {object} ctx — { chave: valor } pra substituir slots
 * @param {function} rng — função RNG (retorna 0-1)
 * @returns {string|null} manchete ou null se categoria inválida
 */
export function pickHeadline(category, ctx, rng) {
    const pool = headlines[category];
    if (!pool || pool.length === 0) return null;
    const tpl = pool[Math.floor(rng() * pool.length)];
    return tpl.replace(/\{(\w+)\}/g, (_, k) => ctx[k] ?? `[${k}]`);
}

/**
 * Lista todas as categorias disponíveis.
 */
export function getAvailableCategories() {
    return Object.keys(headlines);
}

/**
 * Conta total de templates por categoria (debug).
 */
export function countTemplates() {
    const counts = {};
    for (const cat of Object.keys(headlines)) {
        counts[cat] = headlines[cat].length;
    }
    return counts;
}
