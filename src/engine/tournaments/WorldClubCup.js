// SPEC-180: World Club Cup (Mundial de Clubes)
// 8 times: Top 4 da Libertadores + Top 4 da Champions League
// Formato: QF (4 jogos) → SF (2 jogos) → Final (1 jogo)
// Semanas: 32, 34, 36

import { KnockoutCup } from './KnockoutCup';

export class WorldClubCup extends KnockoutCup {
    constructor() {
        super('WORLD_CUP', 'Mundial de Clubes', [32, 34, 36]);
    }

    /**
     * Popula o Mundial com os classificados dos continentais.
     * Chamado pelo SeasonProcessor.rolloverSeason após os Continentais terminarem.
     *
     * @param {Engine} engine — referência ao engine
     * @returns {boolean} true se o torneio foi inicializado com sucesso
     */
    qualify(engine) {
        const lib = engine.getTournament('LIBERTADORES');
        const cl = engine.getTournament('CHAMPIONS');

        if (!lib || !cl) return false;

        // Get top 4 from each continental standings/participants
        const saTeams = this._getTopTeams(lib, 4);
        const euTeams = this._getTopTeams(cl, 4);

        const allTeams = [...saTeams, ...euTeams];

        // Need exactly 8 teams for QF bracket
        if (allTeams.length < 8) return false;

        this.init(allTeams.slice(0, 8));
        return true;
    }

    /**
     * Get top N teams from a continental cup.
     * Uses standings if available, otherwise participants list.
     */
    _getTopTeams(continental, n) {
        // If the continental cup tracked standings/results, use them
        if (continental.standings && continental.standings.length > 0) {
            return continental.standings.slice(0, n).map(s => s.teamId);
        }
        // Fallback: use participants list (first N)
        if (continental.participants && continental.participants.length >= n) {
            return continental.participants.slice(0, n);
        }
        return [];
    }
}
