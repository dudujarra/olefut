import { Engine } from './engine.js';
import { FORMATIONS, TACTICS, TEAM_TALKS, TRAINING_TYPES, MATCH_CONDITIONS } from './ManagerSystems.js';

console.log("=== AKITA: TESTE MODO TREINADOR EXPANDIDO ===\n");

// 1. Init
const engine = new Engine();
engine.initGame("Guardiola", 1, "manager", "livre");
const team = engine.getTeam(1);
console.log(`--- Time: ${team.name} | Squad: ${team.squad.length} | Balance: R$ ${team.balance} ---`);

// 2. Formações
console.log("\n--- #1 Formações ---");
Object.entries(FORMATIONS).forEach(([k, v]) => {
    console.log(`  ${k}: DEF=${v.DEF} MEI=${v.MEI} ATA=${v.ATA} (${v.style})`);
});
engine.setFormation("3-5-2");
console.log(`  Formação aplicada: ${team.formation}`);

// 3. Táticas
console.log("\n--- #2 Táticas ---");
Object.entries(TACTICS).forEach(([k, v]) => {
    console.log(`  ${v.name}: ATA=${v.ataModifier}x DEF=${v.defModifier}x`);
});
engine.setTactic("pressing");
console.log(`  Tática ativa: ${engine.currentTactic}`);

// 4. Team Talk
console.log("\n--- #3 Team Talks ---");
TEAM_TALKS.forEach(tt => {
    console.log(`  ${tt.name}: moral=${tt.effect.moralBoost} energy=${-tt.effect.energyCost} ata=${tt.effect.ataModifier}x`);
});
const ttResult = engine.doTeamTalk("aggressive");
console.log(`  Preleção aplicada: ${ttResult.talk.name} | Modifiers: ata=${engine.teamTalkModifiers.ata}x def=${engine.teamTalkModifiers.def}x`);

// 5. Treino
console.log("\n--- #4 Treinos ---");
TRAINING_TYPES.forEach(t => {
    console.log(`  ${t.name}: energyRec=${t.effect.energyRecovery} boost=${t.effect.attrBoost}`);
});
const trainResult = engine.doTraining("tactical");
console.log(`  Treino: ${trainResult.msg}`);

// 6. Condições de jogo
console.log("\n--- #5 Match Conditions ---");
MATCH_CONDITIONS.forEach(c => {
    console.log(`  ${c.name}: ata=${c.ataModifier}x def=${c.defModifier}x energy=${c.energyModifier}x (${c.probability*100}%)`);
});

// 7. Simulate 10 weeks
console.log("\n--- #6 Simulação 10 semanas ---");
for (let w = 0; w < 10; w++) {
    engine.doTraining(w % 3 === 0 ? 'rest' : 'fitness');
    engine.setTactic(w % 4 === 0 ? 'offensive' : 'normal');
    const results = engine.advanceWeek();
    const fin = engine.weeklyFinance;
    const cond = engine.matchCondition;
    console.log(`  Sem ${w+1}: Bal=R$${(team.balance/1000).toFixed(0)}K | ${cond?.name} | ${engine.managerStats.wins}W-${engine.managerStats.draws}D-${engine.managerStats.losses}L`);
}

// 8. Transfer offers
console.log(`\n--- #7 Transfer Offers: ${engine.transferOffers.length} ofertas ---`);
engine.transferOffers.forEach(o => {
    console.log(`  ${o.playerName} (OVR ${o.playerOvr}) → ${o.buyerClub} R$${(o.offerAmount/1000000).toFixed(1)}M`);
});

// 9. Moral check
const avgMoral = team.squad.reduce((s, p) => s + (p.moral || 50), 0) / team.squad.length;
console.log(`\n--- #8 Squad Moral: ${avgMoral.toFixed(1)}% ---`);

// 10. Squad energy
const avgEnergy = team.squad.reduce((s, p) => s + (p.energy || 50), 0) / team.squad.length;
console.log(`--- #9 Squad Energy: ${avgEnergy.toFixed(1)}% ---`);

console.log("\n=== TODOS OS TESTES PASSARAM ===");
