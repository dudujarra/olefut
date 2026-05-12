/**
 * SPEC-F5.1: OnboardingTriggers harness
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    ONBOARDING_BY_VIEW,
    hasOnboardingPending,
    getOnboardingForView,
    markOnboardingSeen,
    resetAllOnboarding,
    getSeenViews,
} from '../../src/engine/OnboardingTriggers.js';

describe('SPEC-F5.1: OnboardingTriggers', () => {

    beforeEach(() => resetAllOnboarding());

    describe('catalog', () => {
        it('cobre 8+ views', () => {
            expect(Object.keys(ONBOARDING_BY_VIEW).length).toBeGreaterThanOrEqual(8);
        });

        it('each view tem title + steps array', () => {
            Object.values(ONBOARDING_BY_VIEW).forEach(v => {
                expect(typeof v.title).toBe('string');
                expect(Array.isArray(v.steps)).toBe(true);
                expect(v.steps.length).toBeGreaterThanOrEqual(2);
            });
        });

        it('contém views chave: market, squad, standings, press, chronicle', () => {
            ['market', 'squad', 'standings', 'press', 'chronicle'].forEach(v => {
                expect(ONBOARDING_BY_VIEW[v]).toBeDefined();
            });
        });
    });

    describe('hasOnboardingPending', () => {
        it('pending por default', () => {
            expect(hasOnboardingPending('market')).toBe(true);
        });

        it('false após markSeen', () => {
            markOnboardingSeen('market');
            expect(hasOnboardingPending('market')).toBe(false);
        });

        it('view desconhecida → false', () => {
            expect(hasOnboardingPending('nonexistent')).toBe(false);
        });
    });

    describe('getOnboardingForView', () => {
        it('retorna content', () => {
            const r = getOnboardingForView('market');
            expect(r.title).toBe('MERCADO');
            expect(r.steps.length).toBeGreaterThan(0);
        });

        it('view desconhecida → null', () => {
            expect(getOnboardingForView('nonexistent')).toBe(null);
        });
    });

    describe('getSeenViews', () => {
        it('vazio inicial', () => {
            expect(getSeenViews()).toEqual([]);
        });

        it('lista views marcadas', () => {
            markOnboardingSeen('market');
            markOnboardingSeen('press');
            const seen = getSeenViews();
            expect(seen).toContain('market');
            expect(seen).toContain('press');
            expect(seen.length).toBe(2);
        });
    });

    describe('resetAllOnboarding', () => {
        it('reseta todos seen', () => {
            markOnboardingSeen('market');
            markOnboardingSeen('squad');
            resetAllOnboarding();
            expect(getSeenViews()).toEqual([]);
            expect(hasOnboardingPending('market')).toBe(true);
        });
    });
});
