import axios from 'axios';

const api = axios.create({
    baseURL: 'https://api.sofascore.com/api/v1',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Origin': 'https://www.sofascore.com',
        'Referer': 'https://www.sofascore.com/'
    }
});

/**
 * Procura um time pelo nome e retorna os resultados do Sofascore
 */
export async function searchTeam(query) {
    try {
        const response = await api.get(`/search/all?q=${encodeURIComponent(query)}`);
        return response.data.results.filter(r => r.type === 'team');
    } catch (error) {
        throw new Error(`Erro na busca do time ${query}: ${error.message}`, { cause: error });
    }
}

/**
 * Busca todos os jogadores do elenco de um time específico
 */
export async function getTeamSquad(teamId) {
    try {
        const response = await api.get(`/team/${teamId}/players`);
        return response.data.players || [];
    } catch (error) {
        throw new Error(`Erro ao buscar elenco do time ${teamId}: ${error.message}`, { cause: error });
    }
}
