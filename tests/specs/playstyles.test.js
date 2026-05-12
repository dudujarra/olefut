import { describe, it, expect } from 'vitest';
import { MatchSimulator } from '../../src/services/MatchSimulator.js';

describe('AKITA-126 Playstyle Mechanics', () => {
    it('Should correctly distribute cards based on temperament', () => {
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

        for(let i=0; i<1000; i++) {
            const result = sim.simulate(engine, 1, 2, false);
            if (result.events && result.events.cards) {
                result.events.cards.forEach(c => {
                    if (c.type === 'yellow') stats.TotalYellows++;
                    if (c.type === 'red') stats.TotalReds++;
                    
                    if (c.player.includes('Caneleiro')) stats.Caneleiro++;
                    if (c.player.includes('Fairplay')) stats.Fairplay++;
                    if (c.player.includes('Sanguíneo')) stats.Sanguíneo++;
                    if (c.player.includes('Discreto')) stats.Discreto++;
                });
            }
        }

        console.log('--- 1000 MATCHES SIMULATED ---');
        console.log(`Zagueiro Caneleiro cards: ${stats.Caneleiro}`);
        console.log(`Zagueiro Fairplay cards: ${stats.Fairplay}`);
        console.log(`Atacante Sanguíneo cards: ${stats.Sanguíneo}`);
        console.log(`Zagueiro Discreto cards: ${stats.Discreto}`);
        
        // Assertions to mathematically prove the mechanics
        // 1. Caneleiro vs Fairplay (both defenders)
        expect(stats.Caneleiro).toBeGreaterThan(stats.Fairplay * 5); // Should be roughly 11x more likely
        
        // 2. Sanguíneo (ATA, 3.5%) vs Fairplay (DEF, 0.3% * 1.3)
        // Sanguíneo has 3.5%, Fairplay has 0.39%. Should be ~9x more likely
        expect(stats.Sanguíneo).toBeGreaterThan(stats.Fairplay * 5);

        // 3. Caneleiro (DEF) vs Sanguíneo (ATA)
        // Defender has a 1.3x multiplier over attacker even with same playstyle
        expect(stats.Caneleiro).toBeGreaterThan(stats.Sanguíneo);
    });
});
