/**
 * SPEC-166 harness — LineageView inline-style audit.
 *
 * LineageView foi omitida do batch B3.1 UI consistency (SPEC-170/172/173/175).
 * Esta SPEC bate o ceiling pra que regressões reintroduzindo inline styles
 * (estilo `colors = {...}` + `style={{ ... }}` repetido) sejam pegas pelo CI.
 *
 * Ceiling: ≤10 inline `style=` (aceitável: dynamic per-item accent/color,
 * background-image, single-use unique overrides). Pré-refactor: 57. Pós: 8.
 */
import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const lineageView = path.join(projectRoot, 'src/components/LineageView.jsx');

describe('SPEC-166 — LineageView inline-style ceiling', () => {
    test('LineageView.jsx existe', () => {
        expect(fs.existsSync(lineageView)).toBe(true);
    });

    test('LineageView usa ≤10 inline `style={{ ... }}` blocks', () => {
        const src = fs.readFileSync(lineageView, 'utf-8');
        const matches = src.match(/style=\{\{/g) || [];
        expect(matches.length, `expected ≤10, found ${matches.length}`).toBeLessThanOrEqual(10);
    });

    test('LineageView não declara `colors = {...}` local (anti-pattern SPEC-170)', () => {
        const src = fs.readFileSync(lineageView, 'utf-8');
        // Pattern: `const colors = {` or `let colors = {` inside the component body.
        expect(src).not.toMatch(/\b(?:const|let)\s+colors\s*=\s*\{/);
    });

    test('LineageView não usa identificadores soltos `fontMono` / `fontSans` (no-undef bait)', () => {
        const src = fs.readFileSync(lineageView, 'utf-8');
        // Look for spread / reference forms that would lint as no-undef if the
        // local declarations were removed without cleaning all callsites.
        expect(src).not.toMatch(/\.\.\.fontMono\b/);
        expect(src).not.toMatch(/\.\.\.fontSans\b/);
        // Direct refs like `fontMono.fontFamily` would also bait.
        expect(src).not.toMatch(/\bfontMono\.fontFamily\b/);
        expect(src).not.toMatch(/\bfontSans\.fontFamily\b/);
    });

    test('LineageView usa utility classes pattern SPEC-170/172/173/175', () => {
        const src = fs.readFileSync(lineageView, 'utf-8');
        // Sanity: o arquivo deve referenciar pelo menos algumas das utilities
        // canônicas (header, scene-shell, empty-state).
        expect(src).toMatch(/ef-scene-shell/);
        expect(src).toMatch(/ef-view-header/);
        expect(src).toMatch(/ef-empty-state/);
    });
});
