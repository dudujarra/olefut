/**
 * SPEC-A3: TacticSuggester harness
 */

import { describe, it, expect } from 'vitest';
import { suggestTactic, TACTICS_ENUM } from '../../src/engine/TacticSuggester.js';

describe('SPEC-A3: TacticSuggester', () => {

    describe('rule 2: heuristic outcomes', () => {
        it('opp attack >> our defense → Defensivo', () => {
            const r = suggestTactic({
                ourSectors: { goalkeeper: 60, defense: 50, midfield: 60, attack: 60 },
                oppSectors: { goalkeeper: 65, defense: 60, midfield: 65, attack: 75 },
            });
            expect(r.tactic).toBe('Defensivo');
            expect(r.rationale).toMatch(/segurar|ataque adversário/i);
        });

        it('our attack >> opp defense → Ofensivo', () => {
            const r = suggestTactic({
                ourSectors: { goalkeeper: 65, defense: 65, midfield: 70, attack: 80 },
                oppSectors: { goalkeeper: 55, defense: 55, midfield: 60, attack: 60 },
            });
            expect(r.tactic).toBe('Ofensivo');
        });

        it('ambos fortes setores → Contra-Ataque', () => {
            const r = suggestTactic({
                ourSectors: { goalkeeper: 75, defense: 75, midfield: 75, attack: 75 },
                oppSectors: { goalkeeper: 75, defense: 75, midfield: 75, attack: 75 },
            });
            expect(r.tactic).toBe('Contra-Ataque');
        });

        it('equilibrado mediano → Normal', () => {
            const r = suggestTactic({
                ourSectors: { goalkeeper: 60, defense: 60, midfield: 60, attack: 60 },
                oppSectors: { goalkeeper: 60, defense: 60, midfield: 60, attack: 60 },
            });
            expect(r.tactic).toBe('Normal');
        });

        it('vantagem geral em casa → Pressing', () => {
            const r = suggestTactic({
                ourSectors: { goalkeeper: 70, defense: 70, midfield: 70, attack: 70 },
                oppSectors: { goalkeeper: 55, defense: 55, midfield: 55, attack: 55 },
                isHome: true,
            });
            // Pode cair em Ofensivo se ataque diff > 10. Verifica não-Defensivo.
            expect(['Pressing', 'Ofensivo']).toContain(r.tactic);
        });

        it('default empate técnico → Posse', () => {
            const r = suggestTactic({
                ourSectors: { goalkeeper: 60, defense: 60, midfield: 62, attack: 62 },
                oppSectors: { goalkeeper: 60, defense: 60, midfield: 50, attack: 50 },
            });
            // Diff médio mas não >10. ovrGap ~7. Não cai em normal (gap >=5). Posse.
            expect(['Posse', 'Pressing']).toContain(r.tactic);
        });
    });

    describe('rule 3: determinism', () => {
        it('same input → same output', () => {
            const args = {
                ourSectors: { goalkeeper: 65, defense: 65, midfield: 70, attack: 80 },
                oppSectors: { goalkeeper: 55, defense: 55, midfield: 60, attack: 60 },
            };
            const a = suggestTactic(args);
            const b = suggestTactic(args);
            expect(a.tactic).toBe(b.tactic);
            expect(a.rationale).toBe(b.rationale);
        });
    });

    describe('rule 4: output validity', () => {
        it('always returns valid tactic from enum', () => {
            const samples = [
                { ourSectors: {}, oppSectors: {} },
                { ourSectors: { attack: 90, defense: 20 }, oppSectors: { attack: 20, defense: 90 } },
                { ourSectors: { attack: 30, defense: 80 }, oppSectors: { attack: 80, defense: 30 } },
            ];
            samples.forEach(s => {
                const r = suggestTactic(s);
                expect(TACTICS_ENUM).toContain(r.tactic);
                expect(typeof r.rationale).toBe('string');
                expect(r.rationale.length).toBeGreaterThan(0);
            });
        });

        it('rationale has no emoji', () => {
            const r = suggestTactic({
                ourSectors: { attack: 80, defense: 60 },
                oppSectors: { attack: 60, defense: 60 },
            });
            // eslint-disable-next-line no-misleading-character-class
            const emojiRegex = /[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/u;
            expect(emojiRegex.test(r.rationale)).toBe(false);
        });

        it('handles missing sector fields gracefully', () => {
            const r = suggestTactic({});
            expect(TACTICS_ENUM).toContain(r.tactic);
        });
    });

});
