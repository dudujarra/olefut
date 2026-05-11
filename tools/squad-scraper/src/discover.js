import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { searchTeam } from './api.js';

// Precisamos importar as DBs do jogo principal
// Para facilitar no ES Modules sem setup complexo, vamos ler e fazer um parse basico (ou usar eval/import)
import { BrazilDB } from '../../../src/engine/db/brazil.js';
import { EuropeDB } from '../../../src/engine/db/europe.js';
import { SouthAmericaDB } from '../../../src/engine/db/south_america.js';

async function main() {
    console.log(chalk.blue.bold('🔍 Mapeamento Automático de Times no Sofascore'));
    
    // Coletar todos os times do jogo
    const allTeams = [];
    Object.entries(BrazilDB).forEach(([div, teams]) => {
        teams.forEach(t => allTeams.push({ name: t.name, tier: parseInt(div), zone: 'BRA' }));
    });
    Object.entries(EuropeDB).forEach(([zone, divs]) => {
        Object.entries(divs).forEach(([div, teams]) => {
            teams.forEach(t => allTeams.push({ name: t.name, tier: parseInt(div), zone }));
        });
    });
    Object.entries(SouthAmericaDB).forEach(([zone, divs]) => {
        Object.entries(divs).forEach(([div, teams]) => {
            teams.forEach(t => allTeams.push({ name: t.name, tier: parseInt(div), zone }));
        });
    });

    console.log(`Total de times na base do Elifoot: ${allTeams.length}\n`);

    const teamsMap = {};
    const unmatched = [];
    const nameReplacements = []; // Times que o nome difere (ex: Athletico-PR -> Athletico)

    const spinner = ora('Buscando IDs...').start();

    for (const team of allTeams) {
        spinner.text = `Buscando: ${team.name}`;
        
        try {
            // Limpezas de nome para melhorar a busca
            let query = team.name.replace(' (URU)', '');
            
            const results = await searchTeam(query);
            
            if (results && results.length > 0) {
                // Pega o primeiro time retornado
                const match = results[0].entity;
                teamsMap[team.name] = { id: match.id, tier: team.tier };
                
                // Se o nome for muito diferente, marcamos para log
                if (match.name.toLowerCase() !== query.toLowerCase()) {
                    nameReplacements.push({ 
                        original: team.name, 
                        sofascore: match.name, 
                        id: match.id 
                    });
                }
            } else {
                unmatched.push(team.name);
            }
        } catch (error) {
            unmatched.push(team.name);
        }

        // Rate limit para não tomar ban
        await new Promise(r => setTimeout(r, 600));
    }

    spinner.succeed('Busca concluída!');

    // Salvar o dicionário principal
    fs.writeFileSync('./src/teams.json', JSON.stringify(teamsMap, null, 2));
    
    // Salvar relatórios
    const outDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    
    fs.writeFileSync(path.join(outDir, 'unmatched_teams.json'), JSON.stringify(unmatched, null, 2));
    fs.writeFileSync(path.join(outDir, 'name_differences.json'), JSON.stringify(nameReplacements, null, 2));

    console.log(chalk.green(`\n✅ ${Object.keys(teamsMap).length} times mapeados com sucesso.`));
    console.log(chalk.yellow(`⚠️  ${unmatched.length} times NÃO encontrados.`));
    console.log(chalk.cyan(`📝 Resultados salvos em ./src/teams.json e ./reports/`));
}

main().catch(console.error);
