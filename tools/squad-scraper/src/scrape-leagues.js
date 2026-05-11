import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { getTeamSquad } from './api.js';
import { mapPlayer } from './mapper.js';
import axios from 'axios';

// IDs dos principais torneios do Sofascore
const TOURNAMENTS = [
    { id: 17, name: 'Premier League', tier: 1 },
    { id: 8, name: 'LaLiga', tier: 1 },
    { id: 23, name: 'Serie A', tier: 1 },
    { id: 35, name: 'Bundesliga', tier: 1 },
    { id: 34, name: 'Ligue 1', tier: 1 },
    { id: 37, name: 'Eredivisie', tier: 2 },
    { id: 238, name: 'Primeira Liga (PT)', tier: 2 },
    { id: 297, name: 'Saudi Pro League', tier: 2 },
    { id: 18, name: 'Championship (ENG)', tier: 2 },
    { id: 54, name: 'Serie A (Equador)', tier: 3 },
    { id: 14, name: 'Liga MX', tier: 3 },
    { id: 242, name: 'J1 League', tier: 4 },
    { id: 11, name: 'Primera A (Colômbia)', tier: 3 },
];

async function getTournamentTeams(tournamentId) {
    try {
        // Obter as seasons do torneio (precisa pegar a season atual)
        const seasonsRes = await axios.get(`https://api.sofascore.com/api/v1/unique-tournament/${tournamentId}/seasons`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Origin': 'https://www.sofascore.com',
                'Referer': 'https://www.sofascore.com/'
            }
        });
        
        const currentSeason = seasonsRes.data.seasons[0];
        
        // Obter os times via standings (classificação)
        const standingsRes = await axios.get(`https://api.sofascore.com/api/v1/unique-tournament/${tournamentId}/season/${currentSeason.id}/standings/total`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*',
                'Origin': 'https://www.sofascore.com',
                'Referer': 'https://www.sofascore.com/'
            }
        });

        const teams = [];
        // O standings vem como um array (às vezes com grupos, às vezes corrida reta)
        const standings = standingsRes.data.standings[0].rows;
        for (const row of standings) {
            teams.push({
                id: row.team.id,
                name: row.team.name
            });
        }
        
        return teams;
    } catch (e) {
        console.error(`Erro ao buscar times do torneio ${tournamentId}: ${e.message}`);
        return [];
    }
}

async function main() {
    console.log(chalk.blue.bold('🌍 Iniciando Extrator Global de Ligas (Mega DB)'));
    
    let allGlobalPlayers = [];
    const spinner = ora('Coletando times dos torneios globais...').start();

    // 1. Pegar todos os times
    let teamsToScrape = [];
    for (const tourney of TOURNAMENTS) {
        spinner.text = `Carregando times: ${tourney.name}`;
        const teams = await getTournamentTeams(tourney.id);
        teams.forEach(t => {
            t.tier = tourney.tier; // Salva o nível técnico para gerar o OVR correto
            teamsToScrape.push(t);
        });
        await new Promise(r => setTimeout(r, 1000));
    }

    spinner.succeed(`Total de times globais mapeados: ${teamsToScrape.length}`);
    
    // 2. Extrair jogadores time a time
    spinner.start('Iniciando o Mega Download de jogadores...');
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < teamsToScrape.length; i++) {
        const t = teamsToScrape[i];
        spinner.text = `Baixando [${i+1}/${teamsToScrape.length}]: ${t.name}`;
        
        try {
            const rawPlayers = await getTeamSquad(t.id);
            if (rawPlayers && rawPlayers.length > 0) {
                const parsed = rawPlayers.map(p => mapPlayer(p, t.name, t.tier));
                allGlobalPlayers = allGlobalPlayers.concat(parsed);
                successCount++;
            }
        } catch (error) {
            failCount++;
        }
        
        // Delay crucial para não tomar IP Ban
        await new Promise(r => setTimeout(r, 800));
    }

    spinner.succeed(`Sincronização global concluída!`);
    console.log(chalk.green(`✅ ${successCount} times baixados com sucesso.`));
    console.log(chalk.cyan(`👥 Total de Gringos extraídos: ${allGlobalPlayers.length}`));

    // 3. Salvar o JSON local
    const outPath = path.join(process.cwd(), 'out', 'globalPlayers.json');
    fs.writeFileSync(outPath, JSON.stringify(allGlobalPlayers, null, 2));

    console.log(chalk.yellow(`💾 Arquivo salvo em: ./out/globalPlayers.json`));
}

main().catch(console.error);
