/**
 * SPEC-171 harness — `--font-mono` / `--font-sans` precisam estar declaradas
 * em `:root` para que os ~401 `var(--font-mono)` / `var(--font-sans)` na app
 * resolvam pra fontes específicas (não fallback silencioso para body font).
 *
 * Sem essas variáveis declaradas, todo header/label/data-row do dashboard
 * resolve pro mesmo `'Pixelify Sans'` do body, descaracterizando a art direction.
 */
import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const isssdPremiumCss = path.join(projectRoot, 'src/styles/isssd-premium.css');

describe('SPEC-171 — font CSS tokens definidos em :root', () => {
    let css;
    test('isssd-premium.css existe', () => {
        expect(fs.existsSync(isssdPremiumCss)).toBe(true);
        css = fs.readFileSync(isssdPremiumCss, 'utf-8');
        expect(css.length).toBeGreaterThan(0);
    });

    test('--font-mono está declarada em :root', () => {
        const content = fs.readFileSync(isssdPremiumCss, 'utf-8');
        // Match a declaration like `--font-mono: ...;` (multi-line tolerant).
        expect(content).toMatch(/--font-mono\s*:\s*[^;]+;/);
    });

    test('--font-sans está declarada em :root', () => {
        const content = fs.readFileSync(isssdPremiumCss, 'utf-8');
        expect(content).toMatch(/--font-sans\s*:\s*[^;]+;/);
    });

    test('--font-mono inclui fallback de monospace genérico (degradação graciosa)', () => {
        const content = fs.readFileSync(isssdPremiumCss, 'utf-8');
        const match = content.match(/--font-mono\s*:\s*([^;]+);/);
        expect(match).toBeTruthy();
        expect(match[1].toLowerCase()).toMatch(/monospace/);
    });

    test('--font-sans inclui fallback de sans-serif genérico (degradação graciosa)', () => {
        const content = fs.readFileSync(isssdPremiumCss, 'utf-8');
        const match = content.match(/--font-sans\s*:\s*([^;]+);/);
        expect(match).toBeTruthy();
        expect(match[1].toLowerCase()).toMatch(/sans-serif/);
    });

    test('declarações ficam dentro de um bloco :root (não soltas)', () => {
        const content = fs.readFileSync(isssdPremiumCss, 'utf-8');
        // Find the index of the first :root { and walk to its matching close
        // (cannot use non-greedy regex because inner content has braces in
        // backticks/template-strings... actually no — CSS has no braces here.
        // Switch to a manual brace-balance scan, robust to comments with `{}`.
        const startIdx = content.indexOf(':root');
        expect(startIdx, ':root block not found').toBeGreaterThanOrEqual(0);
        const openIdx = content.indexOf('{', startIdx);
        let depth = 1;
        let i = openIdx + 1;
        while (i < content.length && depth > 0) {
            const ch = content[i];
            if (ch === '{') depth++;
            else if (ch === '}') depth--;
            i++;
        }
        const block = content.slice(openIdx + 1, i - 1);
        expect(/--font-mono\s*:/.test(block), ':root must declare --font-mono inside the block').toBe(true);
        expect(/--font-sans\s*:/.test(block), ':root must declare --font-sans inside the block').toBe(true);
    });
});
