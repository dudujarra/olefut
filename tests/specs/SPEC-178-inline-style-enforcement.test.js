/**
 * SPEC-178 — Inline style ESLint enforcement harness.
 *
 * Validates eslint.config.js has no-restricted-syntax rule blocking
 * inline JSX style attributes (Mandamento Brutal #4 enforcement).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CONFIG_PATH = resolve(process.cwd(), 'eslint.config.js');
const config = readFileSync(CONFIG_PATH, 'utf8');

describe('SPEC-178: inline-style ESLint rule', () => {
    it('eslint.config.js declares no-restricted-syntax rule', () => {
        expect(config).toMatch(/no-restricted-syntax/);
    });

    it('rule targets JSXAttribute style selector', () => {
        expect(config).toMatch(/JSXAttribute\[name\.name='style'\]/);
    });

    it('rule level is warn (não error — débito existente)', () => {
        expect(config).toMatch(/'no-restricted-syntax':\s*\['warn'/);
    });

    it('rule message references Mandamento Brutal #4', () => {
        expect(config).toMatch(/Mandamento Brutal #4/);
    });

    it('rule message guides developer to CSS class fallback', () => {
        expect(config).toMatch(/CSS class/);
    });

    it('rule message documents exception pattern', () => {
        expect(config).toMatch(/eslint-disable-next-line/);
    });
});
