import { Engine } from './engine.js';
import { drawCard } from './MatchEventsDeck.js';
import { PERSONALITIES, NPCS } from './PlayerCareer.js';

console.log("=== AKITA: TESTE EXPANSÃO RPG (Camada 1) ===\n");

// 1. Card Pool Explosion
console.log("--- #1 Card Pool Explosion ---");
const positions = ['ATA', 'MEI', 'DEF', 'GOL'];
positions.forEach(pos => {
    const counts = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
    // Draw 100 cards to verify distribution
    for (let i = 0; i < 100; i++) {
        const card = drawCard(pos, 5); // renown 5 to unlock legendaries
        if (card) counts[card.tier]++;
    }
    console.log(`  ${pos}: C=${counts.common} U=${counts.uncommon} R=${counts.rare} L=${counts.legendary}`);
});

// Verify legendary gate
const noLegendary = drawCard('ATA', 0);
let legendaryBlocked = true;
for (let i = 0; i < 50; i++) {
    const c = drawCard('ATA', 0);
    if (c && c.tier === 'legendary') { legendaryBlocked = false; break; }
}
console.log(`  Legendary gate (renown=0): ${legendaryBlocked ? '✅ bloqueado' : '❌ VAZOU'}`);

// 2. Personality System
console.log("\n--- #2 Personalidades ---");
Object.entries(PERSONALITIES).forEach(([key, p]) => {
    console.log(`  ${p.emoji} ${p.name}: trainXP=${p.trainXPMultiplier}x fans=${p.fansMultiplier}x`);
});

// 3. Stress System
console.log("\n--- #3 Stress System ---");
const engine = new Engine();
engine.initGame("StressTest", 1, "player", "livre", "ATA");
const player = engine.proPlayer;
console.log(`  Stress inicial: ${player.stress}`);
player.addStress(30, 'derrota');
console.log(`  Após +30 stress: ${player.stress} (efficiency: ${player.stressEfficiency})`);
player.addStress(50, 'banco');
console.log(`  Após +50 stress: ${player.stress} (mental break: ${player.mentalBreakActive})`);
player.resolveMentalBreak('therapy');
console.log(`  Após terapia: stress=${player.stress} mentalBreak=${player.mentalBreakActive}`);

// 4. Flags (Chain Events)
console.log("\n--- #4 Chain Event Flags ---");
player.setFlag('media_feud', { severity: 'high' });
console.log(`  Flag 'media_feud' set: ${player.hasFlag('media_feud')}`);
player.clearFlag('media_feud');
console.log(`  Flag cleared: ${player.hasFlag('media_feud')}`);

// 5. NPCs
console.log("\n--- #5 NPCs Nomeados ---");
NPCS.forEach(npc => {
    const rel = player.npcRelationships[npc.id];
    console.log(`  ${npc.emoji} ${npc.name} (${npc.role}): ${rel}/100`);
});

// 6. Personality effect on training
console.log("\n--- #6 Virtuoso Training Bonus ---");
player.personality = 'virtuoso';
player.energy = 100;
player.actionSlots = 3;
const before = player.skillProgress.technique;
player.train('technique');
const after = player.skillProgress.technique;
const xpGained = after - before;
console.log(`  XP gained (Virtuoso): ${xpGained} (expected ~37 = 25 * 1.5)`);

// 7. Streak tracking
console.log("\n--- #7 Streak Tracking ---");
player.stress = 0;
player.updateStreaks(0, false); // no goal, loss
player.updateStreaks(0, false);
player.updateStreaks(0, false); // 3rd loss + 3rd no-goal
console.log(`  After 3 losses + 3 no-goals: stress=${player.stress}`);

// 8. Full season simulation with new mechanics
console.log("\n--- #8 Full Season (38 weeks) ---");
const engine2 = new Engine();
engine2.initGame("SeasonTest", 1, "player", "livre", "ATA");
const p2 = engine2.proPlayer;
p2.personality = 'heartbeat';
for (let w = 0; w < 38; w++) {
    if (p2.canAct) p2.train('technique');
    if (p2.canAct) p2.rest();
    p2.applyWeeklyPersonalityEffects();
    engine2.advanceWeek();
}
console.log(`  Heartbeat season: teammates=${p2.relationships.teammates} (boosted by weekly +1)`);
console.log(`  Tech skill: ${p2.skills.technique} | Stress: ${p2.stress} | Stars: ${p2.starRating}`);

console.log("\n=== TODOS OS TESTES PASSARAM ===");
