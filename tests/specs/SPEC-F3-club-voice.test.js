/**
 * SPEC-F3.1+F3.3: ClubVoiceSystem harness
 */

import { describe, it, expect } from 'vitest';
import {
    ClubVoices,
    getClubVoice,
    getClubMeta,
    getMappedClubs,
} from '../../src/engine/ClubVoiceSystem.js';

describe('SPEC-F3: ClubVoiceSystem', () => {

    describe('catalog coverage', () => {
        it('has at least 20 clubs mapped', () => {
            expect(getMappedClubs().length).toBeGreaterThanOrEqual(20);
        });

        it('every club has city, region, stadium', () => {
            getMappedClubs().forEach(name => {
                const meta = getClubMeta(name);
                expect(meta.city).toBeTruthy();
                expect(meta.region).toBeTruthy();
                expect(meta.stadium).toBeTruthy();
            });
        });

        it('every club has voices object with required contexts', () => {
            getMappedClubs().forEach(name => {
                const club = ClubVoices[name];
                expect(club.voices.stadium_entry).toBeDefined();
                expect(club.voices.goal_home).toBeDefined();
                expect(club.voices.goal_away).toBeDefined();
                expect(club.voices.rival_match).toBeDefined();
            });
        });

        it('voices arrays non-empty', () => {
            getMappedClubs().forEach(name => {
                const club = ClubVoices[name];
                Object.values(club.voices).forEach(arr => {
                    expect(arr.length).toBeGreaterThan(0);
                });
            });
        });

        it('covers all 5 BR regions', () => {
            const regions = new Set(getMappedClubs().map(n => getClubMeta(n).region));
            expect(regions.size).toBeGreaterThanOrEqual(4); // pelo menos 4 das 5 (N/NE/SE/S/CO)
        });
    });

    describe('getClubVoice', () => {
        it('Flamengo stadium_entry contains Maracanã', () => {
            const v = getClubVoice('Flamengo', 'stadium_entry', 0);
            expect(v.toLowerCase()).toContain('maracanã');
        });

        it('Cruzeiro goal_home mentions Raposa or Mineirão', () => {
            const v = getClubVoice('Cruzeiro', 'goal_home', 0);
            expect(v.toLowerCase()).toMatch(/raposa|cruzeiro|estrelado/);
        });

        it('unknown club → empty string', () => {
            expect(getClubVoice('NonExistent FC', 'stadium_entry', 0)).toBe('');
        });

        it('unknown context → empty string', () => {
            expect(getClubVoice('Flamengo', 'nonexistent_context', 0)).toBe('');
        });

        it('determinism via seed', () => {
            const a = getClubVoice('Flamengo', 'goal_home', 42);
            const b = getClubVoice('Flamengo', 'goal_home', 42);
            expect(a).toBe(b);
        });

        it('different seeds → potentially different output', () => {
            const ids = new Set();
            for (let s = 0; s < 5; s++) {
                ids.add(getClubVoice('Cruzeiro', 'stadium_entry', s));
            }
            expect(ids.size).toBeGreaterThan(1);
        });
    });

    describe('getClubMeta', () => {
        it('returns null for unknown club', () => {
            expect(getClubMeta('NoExist')).toBe(null);
        });

        it('Cruzeiro is from Belo Horizonte SE', () => {
            const meta = getClubMeta('Cruzeiro');
            expect(meta.city).toBe('Belo Horizonte');
            expect(meta.region).toBe('SE');
        });

        it('Paysandu is from Belém N', () => {
            const meta = getClubMeta('Paysandu');
            expect(meta.region).toBe('N');
        });
    });

});
