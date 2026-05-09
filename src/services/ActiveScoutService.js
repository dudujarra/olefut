/**
 * ActiveScoutService — SPEC-091
 *
 * Busca jogadores em todos os 79 squads scrapeados por critérios.
 * Returns candidatos rankeados.
 */

import { mapSofaScorePosition } from '../engine/Positions';

let CACHE = null;

async function loadAllSquads() {
    if (CACHE) return CACHE;
    const all = [];

    // Try fetch list from public/data/squads/ — fallback to known club slugs
    const knownSlugs = [
        'flamengo', 'palmeiras', 'corinthians', 'sao-paulo', 'santos', 'gremio',
        'internacional', 'atletico-mg', 'cruzeiro', 'fluminense', 'vasco', 'botafogo',
        'athletico-pr', 'bahia', 'fortaleza', 'ceara', 'sport-recife', 'vitoria',
        'goias', 'coritiba', 'ponte-preta', 'juventude', 'criciuma', 'vila-nova',
        'atletico-go', 'america-mg', 'chapecoense', 'avai', 'nautico', 'paysandu', 'remo',
        'manchester-united', 'manchester-city', 'liverpool', 'arsenal', 'chelsea',
        'tottenham', 'newcastle', 'aston-villa', 'brighton', 'west-ham',
        'real-madrid', 'barcelona', 'atletico-madrid', 'sevilla', 'valencia',
        'villarreal', 'real-sociedad', 'athletic-bilbao', 'real-betis', 'celta-vigo',
        'inter', 'milan', 'juventus', 'roma', 'napoli', 'lazio', 'atalanta',
        'fiorentina', 'torino', 'bologna',
        'bayern-munich', 'borussia-dortmund', 'rb-leipzig', 'bayer-leverkusen',
        'eintracht-frankfurt', 'wolfsburg', 'hoffenheim', 'stuttgart',
        'psg', 'marseille', 'lyon', 'monaco', 'lille', 'nice', 'rennes',
        'lens', 'strasbourg', 'montpellier'
    ];

    for (const slug of knownSlugs) {
        try {
            const url = `${import.meta.env.BASE_URL || '/'}data/squads/${slug}.json`.replace('//', '/');
            const res = await fetch(url);
            if (!res.ok) continue;
            const data = await res.json();
            const players = Array.isArray(data) ? data : (data.players || []);
            const teamName = data.teamName || slug;
            players.forEach(p => {
                all.push({ ...p, _team: teamName });
            });
        } catch {
            /* skip */
        }
    }

    CACHE = all;
    return all;
}

/**
 * Search criteria.
 * @param {object} criteria - { position, ageMin, ageMax, ovrMin, valueMax, country }
 */
export async function searchPlayers(criteria = {}) {
    const all = await loadAllSquads();

    return all
        .filter(p => {
            // Position filter
            if (criteria.position) {
                const pos = mapSofaScorePosition(p.positionsDetailed?.[0] || p.position);
                if (pos !== criteria.position) return false;
            }

            // Age filter
            if (criteria.ageMin || criteria.ageMax) {
                const age = p.dateOfBirth
                    ? Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))
                    : null;
                if (age === null) return false;
                if (criteria.ageMin && age < criteria.ageMin) return false;
                if (criteria.ageMax && age > criteria.ageMax) return false;
            }

            // OVR (pentagon avg) filter
            if (criteria.ovrMin && p.pentagon) {
                const avg = (p.pentagon.attacking + p.pentagon.technical + p.pentagon.tactical + p.pentagon.defending + p.pentagon.creativity) / 5;
                if (avg < criteria.ovrMin) return false;
            }

            // Value filter (EUR)
            if (criteria.valueMax && p.proposedMarketValue && p.proposedMarketValue > criteria.valueMax) return false;

            // Country
            if (criteria.country && p.country?.alpha2 !== criteria.country) return false;

            return true;
        })
        .map(p => {
            const ovr = p.pentagon
                ? Math.round((p.pentagon.attacking + p.pentagon.technical + p.pentagon.tactical + p.pentagon.defending + p.pentagon.creativity) / 5)
                : null;
            return { ...p, _ovr: ovr };
        })
        .sort((a, b) => (b._ovr || 0) - (a._ovr || 0))
        .slice(0, 50);
}
