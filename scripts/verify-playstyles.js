import { MatchSimulator } from '../src/services/MatchSimulator.js';
import { rng } from '../src/engine/rng.js';

// Mock engine
const engine = {
    manager: { teamId: 1 },
    currentTactic: 'normal',
    teamTalkModifiers: { ata: 1.0, def: 1.0 },
    getTeam: (id) => {
        if (id === 1) return {
            id: 1, name: 'Home',
            squad: [
                { id: 'h1', name: 'Zagueiro Caneleiro', position: 'DEF', isTitular: true, playstyle: 'Caneleiro', ovr: 70 },
                { id: 'h2', name: 'Zagueiro Fairplay', position: 'DEF', isTitular: true, playstyle: 'Fairplay', ovr: 70 },
                { id: 'h3', name: 'Atacante Sanguíneo', position: 'ATA', isTitular: true, playstyle: 'Sanguíneo', ovr: 70 }
            ]
        };
        if (id === 2) return {
            id: 2, name: 'Away',
            squad: [
                { id: 'a1', name: 'Zagueiro Discreto', position: 'DEF', isTitular: true, playstyle: 'Discreto', ovr: 70 }
            ]
        };
    },
    getTeamSectors: () => ({ attack: 70, defense: 70, midfield: 70, goalkeeper: 70 })
};

const sim = new MatchSimulator();
const stats = { Caneleiro: 0, Fairplay: 0, Sanguíneo: 0, Discreto: 0, TotalYellows: 0, TotalReds: 0 };

console.log('Simulating 1000 matches to verify card distribution by playstyle...');

for(let i=0; i<1000; i++) {
    const result = sim.simulate(engine, 1, 2, false);
    result.events.cards.forEach(c => {
        if (c.type === 'yellow') stats.TotalYellows++;
        if (c.type === 'red') stats.TotalReds++;
        
        if (c.player.includes('Caneleiro')) stats.Caneleiro++;
        if (c.player.includes('Fairplay')) stats.Fairplay++;
        if (c.player.includes('Sanguíneo')) stats.Sanguíneo++;
        if (c.player.includes('Discreto')) stats.Discreto++;
    });
}

console.log('RESULTS OVER 1000 MATCHES:');
console.log(stats);
