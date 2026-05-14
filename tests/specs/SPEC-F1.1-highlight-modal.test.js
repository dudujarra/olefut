/**
 * SPEC-F1.1: MatchHighlightModal pure helpers
 */

import { describe, it, expect } from 'vitest';
import {
    extractHighlightContext,
    getHighlightIcon,
    getHighlightColor,
    MatchHighlightModal,
} from '../../src/components/MatchHighlightModal.jsx';

describe('SPEC-F1.1: MatchHighlightModal', () => {

    describe('extractHighlightContext', () => {
        it('detects goal via emoji', () => {
            const r = extractHighlightContext({ minute: 23, text: '⚽ GOL! Pelé marca!' });
            expect(r?.type).toBe('goal');
            expect(r?.minute).toBe(23);
        });

        it('detects red via emoji', () => {
            const r = extractHighlightContext({ minute: 67, text: '🟥 EXPULSO!' });
            expect(r?.type).toBe('red');
        });

        it('detects goal via lowercase text', () => {
            const r = extractHighlightContext({ minute: 10, text: 'GOOOL do Cruzeiro!' });
            expect(r?.type).toBe('goal');
        });

        it('non-highlight event → null', () => {
            const r = extractHighlightContext({ minute: 5, text: 'Escanteio para o Cruzeiro' });
            expect(r).toBe(null);
        });

        it('null entry → null', () => {
            expect(extractHighlightContext(null)).toBe(null);
        });

        it('empty text → null', () => {
            expect(extractHighlightContext({ minute: 1, text: '' })).toBe(null);
        });
    });

    describe('getHighlightColor', () => {
        it('goal → accent token', () => {
            expect(getHighlightColor('goal')).toBe('var(--accent)');
        });

        it('red → danger token', () => {
            expect(getHighlightColor('red')).toBe('var(--danger)');
        });

        it('outro → text-main token', () => {
            expect(getHighlightColor('other')).toBe('var(--text-main)');
        });
    });

    describe('getHighlightIcon', () => {
        it('returns function (component) for each type', () => {
            expect(typeof getHighlightIcon('goal')).toBe('object');
            expect(typeof getHighlightIcon('red')).toBe('object');
            expect(typeof getHighlightIcon('other')).toBe('object');
        });
    });

    describe('module integrity', () => {
        it('MatchHighlightModal exported', () => {
            expect(typeof MatchHighlightModal).toBe('function');
        });
    });
});
