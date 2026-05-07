import { Engine } from './engine.js';

console.log("=== AKITA MODE: TESTE DO MODO JOGADOR (BE A PRO) ===");

const engine = new Engine();
engine.initGame("Dudu Pro", 1, "player", "livre", "ATA");

const player = engine.proPlayer;
console.log(`Jogador: ${player.name} | Posição: ${player.position} | Time ID: ${engine.manager.teamId}`);
console.log(`Skills iniciais: TEC=${player.skills.technique} PAC=${player.skills.pace} POW=${player.skills.power} VIS=${player.skills.vision}`);
console.log(`Energia: ${player.energy} | Dinheiro: ${player.money} | Slots: ${player.actionSlots}`);

console.log("\n--- Simulando 8 semanas de carreira ---\n");

for (let week = 0; week < 8; week++) {
    console.log(`\n=== SEMANA ${week + 1} ===`);
    
    // Gastar slots de ação
    if (player.canAct) {
        const trainResult = player.train('technique');
        console.log(`  Treino TEC: ${trainResult.msg}`);
    }
    if (player.canAct) {
        const restResult = player.rest();
        console.log(`  Descanso: ${restResult.msg}`);
    }
    if (player.canAct) {
        const trainResult2 = player.train('pace');
        console.log(`  Treino PAC: ${trainResult2.msg}`);
    }
    // Tentar ação sem slot
    if (player.canAct) {
        console.log(`  ⚠️ Ainda tem ações? Deveria ter 0!`);
    } else {
        console.log(`  ✅ Sem ações restantes. Hora de jogar.`);
    }

    // Avançar semana
    const preview = engine.previewPlayerMatch();
    console.log(`  Bench Status: ${preview.isBenched ? '🔴 BANCO' : '🟢 TITULAR'}`);
    
    engine.advanceWeek();
    
    console.log(`  [Pós-Jogo] E=${player.energy}% | $$=${player.money} | Boss=${player.relationships.boss} | Fans=${player.relationships.fans} | Renown=${player.renown} ⭐${player.starRating}`);
}

console.log("\n--- Stats Finais ---");
console.log(`TEC=${player.skills.technique} PAC=${player.skills.pace} POW=${player.skills.power} VIS=${player.skills.vision}`);
console.log(`Gols na temporada: ${player.seasonGoals}`);
console.log(`Renome: ${player.renown} (${player.starRating} estrelas)`);
console.log(`Relacionamentos: Boss=${player.relationships.boss} Fans=${player.relationships.fans} Team=${player.relationships.teammates} Sponsors=${player.relationships.sponsors}`);

console.log("\n=== TESTE JOGADOR CONCLUÍDO ===");
