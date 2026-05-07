import { Engine } from './engine.js';

console.log("=== AKITA MODE: TESTE SILENCIOSO (SEM REACT) ===");

const engine = new Engine();
console.log("1. Inicializando Jogo (Manager: Testador, Time ID: 1, Cenário: Sandbox)...");
engine.initGame("Testador", 1, "manager", "livre");

console.log(`- Total de Times Gerados: ${engine.teams.length}`);
console.log(`- Total de Torneios Criados: ${engine.tournaments.length}`);
engine.tournaments.forEach(t => {
    const type = t.constructor.name;
    console.log(`  > [${type}] ${t.name} (ID: ${t.id}) - Participantes: ${t.participants.length}`);
});

console.log("\n2. Simulando 38 semanas...");
const start = Date.now();
for (let w = 0; w < 38; w++) {
    engine.advanceWeek();
}
const elapsed = Date.now() - start;
console.log(`✅ 38 semanas simuladas em ${elapsed}ms`);

console.log("\n3. Classificação BRA Série A (Top 5):");
const standings = engine.getStandings('BRA', 1);
standings.slice(0, 5).forEach((s, i) => {
    const team = engine.getTeam(s.teamId);
    console.log(`  ${i + 1}. ${team.name} - ${s.points}pts (${s.won}V ${s.drawn}E ${s.lost}D) GF:${s.goalsFor} GC:${s.goalsAgainst}`);
});

console.log("\n4. Copas:");
engine.tournaments.filter(t => t.winner).forEach(t => {
    const winner = engine.getTeam(t.winner);
    console.log(`  🏆 ${t.name}: ${winner ? winner.name : 'N/A'}`);
});

console.log("\n=== TESTE CONCLUÍDO ===");
