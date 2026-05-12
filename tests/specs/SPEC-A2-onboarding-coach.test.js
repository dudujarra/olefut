/**
 * SPEC-A2: Onboarding Coach — harness (pure unit, no JSX render)
 *
 * Valida constantes, conteúdo, persistência localStorage via simulação.
 * Render JSX testado manualmente / playtest (sem @testing-library/react instalado).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { _onboardingInternals } from '../../src/components/OnboardingCoach.jsx';
import fs from 'node:fs';
import path from 'node:path';

const { STORAGE_KEY_DONE, STORAGE_KEY_STEP, STEPS } = _onboardingInternals;

describe('SPEC-A2: Onboarding Coach', () => {

    beforeEach(() => {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(STORAGE_KEY_DONE);
                localStorage.removeItem(STORAGE_KEY_STEP);
            }
        } catch { /* noop */ }
    });

    // Rule 2: 4 sequential steps
    describe('rule 2: step progression structure', () => {
        it('has exactly 4 steps', () => {
            expect(STEPS.length).toBe(4);
        });

        it('step IDs are 1..4 sequential', () => {
            expect(STEPS.map(s => s.id)).toEqual([1, 2, 3, 4]);
        });

        it('every step has title + body', () => {
            STEPS.forEach(s => {
                expect(s.title).toBeTruthy();
                expect(s.body).toBeTruthy();
                expect(typeof s.title).toBe('string');
                expect(typeof s.body).toBe('string');
            });
        });
    });

    // Rule 3: localStorage keys defined
    describe('rule 3: localStorage keys', () => {
        it('STORAGE_KEY_DONE is namespaced elifoot_', () => {
            expect(STORAGE_KEY_DONE).toMatch(/^elifoot_/);
            expect(STORAGE_KEY_DONE).toBe('elifoot_onboarding_done');
        });

        it('STORAGE_KEY_STEP is namespaced elifoot_', () => {
            expect(STORAGE_KEY_STEP).toMatch(/^elifoot_/);
            expect(STORAGE_KEY_STEP).toBe('elifoot_onboarding_step');
        });

        it('localStorage roundtrip works', () => {
            if (typeof localStorage === 'undefined') return;
            localStorage.setItem(STORAGE_KEY_DONE, 'true');
            expect(localStorage.getItem(STORAGE_KEY_DONE)).toBe('true');
            localStorage.removeItem(STORAGE_KEY_DONE);
            expect(localStorage.getItem(STORAGE_KEY_DONE)).toBeNull();
        });
    });

    // Rule 7: content integrity
    describe('rule 7: content integrity', () => {
        it('each step body ≤120 chars (mobile-friendly)', () => {
            STEPS.forEach(s => {
                expect(s.body.length).toBeLessThanOrEqual(120);
            });
        });

        it('each step title ≤30 chars', () => {
            STEPS.forEach(s => {
                expect(s.title.length).toBeLessThanOrEqual(30);
            });
        });

        it('content in PT-BR (sample check on critical keywords)', () => {
            const allText = STEPS.map(s => s.title + ' ' + s.body).join(' ').toLowerCase();
            const ptKeywords = ['dashboard', 'tática', 'partida', 'sorte', 'jogo', 'técnico', 'jogar', 'formação'];
            const hits = ptKeywords.filter(kw => allText.includes(kw));
            expect(hits.length).toBeGreaterThanOrEqual(2);
        });
    });

    // Forbidden: no emoji in source
    describe('forbidden: no emoji in OnboardingCoach.jsx source', () => {
        it('source file has zero emoji codepoints', () => {
            const sourcePath = path.resolve(__dirname, '../../src/components/OnboardingCoach.jsx');
            const src = fs.readFileSync(sourcePath, 'utf-8');
            // Detect emoji presentation codepoints (broad range)
            // eslint-disable-next-line no-misleading-character-class
            const emojiRegex = /[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/u;
            expect(emojiRegex.test(src)).toBe(false);
        });
    });

    // Smoke test: module loads
    describe('smoke: module integrity', () => {
        it('OnboardingCoach component is exported', async () => {
            const mod = await import('../../src/components/OnboardingCoach.jsx');
            expect(typeof mod.OnboardingCoach).toBe('function');
            expect(typeof mod.default).toBe('function');
        });
    });

});
