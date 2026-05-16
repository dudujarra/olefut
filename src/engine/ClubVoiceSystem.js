/**
 * ClubVoiceSystem — SPEC-F3.1
 *
 * Catálogo de vozes textuais contextuais por clube.
 * 176 clubes (BR + EU + SA).
 *
 * Pure module. Determinístico via seed.
 *
 * AKITA-RFCT: Data separada em db/club-voices.json (71KB de strings → JSON puro).
 * Este módulo contém APENAS lógica de lookup.
 */

import ClubVoices from './db/club-voices.json';

/**
 * Retorna voz contextual de um clube. Fallback genérico se clube não mapeado.
 *
 * @param {string} clubName
 * @param {string} contextType — 'stadium_entry'|'goal_home'|'goal_away'|'rival_match'
 * @param {number} seed
 * @returns {string} flavor string
 */
export function getClubVoice(clubName, contextType, seed = 0) {
    if (!clubName) return '';
    const club = ClubVoices[clubName];
    if (!club || !club.voices || !club.voices[contextType]) return '';
    const list = club.voices[contextType];
    if (!Array.isArray(list) || list.length === 0) return '';
    const idx = Math.abs(seed) % list.length;
    return list[idx];
}

/**
 * Retorna metadata do clube (city, region, stadium).
 */
export function getClubMeta(clubName) {
    if (!clubName) return null;
    const club = ClubVoices[clubName];
    if (!club) return null;
    return { city: club.city, region: club.region, stadium: club.stadium };
}

/**
 * Lista clubes mapeados.
 */
export function getMappedClubs() {
    return Object.keys(ClubVoices);
}

// Re-export for backwards compatibility (tests that import ClubVoices directly)
export { ClubVoices };
