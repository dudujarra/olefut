import { describe, it, expect } from 'vitest';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// SPEC-159: build budget gate. Initial chunk ≤ 500KB, qualquer chunk ≤ 800KB, total ≤ 3MB.
// PRECONDIÇÃO: `npm run build` deve rodar ANTES deste teste (CI workflow ordena Build → Unit tests).
// Localmente: se dist/ ausente, teste no-op (skip via dist-check).

const DIST = join(process.cwd(), 'dist', 'assets');
const INITIAL_LIMIT = 500_000;
const SINGLE_CHUNK_LIMIT = 800_000;
const TOTAL_LIMIT = 3_000_000;

const distExists = existsSync(DIST);

describe.skipIf(!distExists)('SPEC-159 build budget', () => {
    it('dist/assets/ existe', () => {
        expect(existsSync(DIST)).toBe(true);
    });

    it('initial chunk (index-*.js) ≤ 500KB', () => {
        const files = readdirSync(DIST).filter(f => f.startsWith('index-') && f.endsWith('.js'));
        expect(files.length, 'esperava um arquivo index-*.js').toBeGreaterThanOrEqual(1);
        const file = files[0];
        const size = statSync(join(DIST, file)).size;
        const msg = `${file}: ${(size / 1024).toFixed(1)}KB (limite: ${INITIAL_LIMIT / 1024}KB)`;
        expect(size, msg).toBeLessThanOrEqual(INITIAL_LIMIT);
    });

    it('nenhum chunk individual > 800KB', () => {
        const files = readdirSync(DIST).filter(f => f.endsWith('.js'));
        const oversize = files
            .map(f => ({ f, size: statSync(join(DIST, f)).size }))
            .filter(({ size }) => size > SINGLE_CHUNK_LIMIT);
        const msg = oversize.map(({ f, size }) => `  ${f}: ${(size / 1024).toFixed(1)}KB`).join('\n');
        expect(oversize, `chunks excedem ${SINGLE_CHUNK_LIMIT / 1024}KB:\n${msg}`).toEqual([]);
    });

    it('total dist/assets/*.js ≤ 3MB', () => {
        const files = readdirSync(DIST).filter(f => f.endsWith('.js'));
        const total = files.reduce((s, f) => s + statSync(join(DIST, f)).size, 0);
        const msg = `total: ${(total / 1024 / 1024).toFixed(2)}MB (limite: ${TOTAL_LIMIT / 1024 / 1024}MB)`;
        expect(total, msg).toBeLessThanOrEqual(TOTAL_LIMIT);
    });
});
