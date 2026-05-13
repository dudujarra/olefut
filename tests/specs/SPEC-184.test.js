/**
 * SPEC-184 — Inline styles reduction
 *
 * Harness Akita Rule 0: falha se inline styles (`style={{`) excederem o teto
 * em AutoPlayView/PlayerDashboardView. Garante que regressão futura (devs
 * adicionando novo style={} inline) seja pega no CI.
 *
 * Falha se:
 * 1. src/components/AutoPlayView.jsx > 35 occorrências de `style={{`
 * 2. src/components/PlayerDashboardView.jsx > 29 occorrências de `style={{`
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');
const REPO_ROOT = resolve(__dirname, '..', '..');

function countInlineStyles(relPath) {
    const content = readFileSync(resolve(REPO_ROOT, relPath), 'utf8');
    const matches = content.match(/style=\{\{/g);
    return matches ? matches.length : 0;
}

describe('SPEC-184: Inline styles reduction', () => {
    it('AutoPlayView.jsx inline styles ≤ 35', () => {
        const count = countInlineStyles('src/components/AutoPlayView.jsx');
        expect(count, `AutoPlayView.jsx tem ${count} inline styles (target ≤ 35)`).toBeLessThanOrEqual(35);
    });

    it('PlayerDashboardView.jsx inline styles ≤ 29', () => {
        const count = countInlineStyles('src/components/PlayerDashboardView.jsx');
        expect(count, `PlayerDashboardView.jsx tem ${count} inline styles (target ≤ 29)`).toBeLessThanOrEqual(29);
    });
});
