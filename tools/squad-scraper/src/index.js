import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { getTeamSquad } from './api.js';
import { mapPlayer } from './mapper.js';

// Usar o readFileSync já que import com assert {type: 'json'} às vezes é chato no Node atual
const teamsJsonPath = new URL('./teams.json', import.meta.url).pathname;
const teamsMap = JSON.parse(fs.readFileSync(teamsJsonPath, 'utf8'));

async function main() {
    console.log(chalk.blue.bold('⚽ Elifoot Squad Scraper v1.0'));
    console.log(chalk.gray('Conectando à API do Sofascore e processando elencos...\n'));

    let allPlayers = [];
    const spinner = ora('Iniciando sincronização...').start();

    const teamNames = Object.keys(teamsMap);
    let successCount = 0;
    let failedCount = 0;

    for (const teamName of teamNames) {
        spinner.text = `Baixando elenco do ${teamName}...`;
        const { id, tier } = teamsMap[teamName];

        try {
            const squadRaw = await getTeamSquad(id);
            const players = squadRaw.map(p => mapPlayer(p, teamName, tier));
            allPlayers = allPlayers.concat(players);
            successCount++;
        } catch (error) {
            spinner.fail(`Falha ao baixar ${teamName}: ${error.message}`);
            spinner.start();
            failedCount++;
        }

        // Delay para evitar Rate Limit (anti-DDoS/WAF do Sofascore)
        await new Promise(r => setTimeout(r, 1000));
    }

    spinner.succeed(`Sincronização concluída!`);
    console.log(chalk.green(`\n✅ ${successCount} times processados com sucesso.`));
    if (failedCount > 0) console.log(chalk.red(`❌ ${failedCount} times falharam.`));
    
    console.log(chalk.cyan(`👥 Total de jogadores extraídos: ${allPlayers.length}`));

    // Salvar o arquivo no formato do engine
    const outDir = path.join(process.cwd(), 'out');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    
    const outPath = path.join(outDir, 'realPlayers_BR.json');
    fs.writeFileSync(outPath, JSON.stringify(allPlayers, null, 2));
    
    console.log(chalk.magenta(`\n💾 Arquivo salvo em: ./out/realPlayers_BR.json`));
    console.log(chalk.gray(`Para importar no jogo, basta juntar esse JSON com o src/data/realPlayers.json`));
}

main().catch(err => {
    console.error(chalk.red('\nErro Crítico:'), err);
});
