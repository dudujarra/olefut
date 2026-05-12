import { describe, it, expect } from 'vitest';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// SPEC-159: build budget gate. Initial chunk ≤ 500KB, qualquer chunk de código ≤ 500KB, total ≤ 3.2MB.
// AKITA-124/125: realPlayers.json injects 11k players (1.48MB raw, 252KB gzip).
// SPEC-177: split realPlayers into 4 regional chunks (BRA, EUR, SAM, pool) via top-level await.
//   - Code chunk ceiling tightened back from 800KB → 500KB (proper Akita budget).
//   - Total tightened from 3.5MB → 3.2MB (split adds ~0 overhead; ceiling matches reality).
//   - Data chunks (player-data legacy + realPlayers_BRA/EUR/SAM/pool) still exempt from per-chunk
//     code limit — they are JSON payload, not executable code, and gzip ~6:1.
// PRECONDIÇÃO: `npm run build` deve rodar ANTES deste teste (CI workflow ordena Build → Unit tests).
// Localmente: se dist/ ausente, teste no-op (skip via dist-check).

const DIST = join(process.cwd(), 'dist', 'assets');
const INITIAL_LIMIT = 500_000;
const SINGLE_CHUNK_LIMIT = 500_000;
const TOTAL_LIMIT = 3_200_000;
// Data-only chunks are excluded from per-chunk code size checks (they are JSON, not code)
const DATA_CHUNKS = /^(player-data|realPlayers_)/;

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

    it('nenhum chunk de código > 500KB', () => {
        const files = readdirSync(DIST).filter(f => f.endsWith('.js') && !DATA_CHUNKS.test(f));
        const oversize = files
            .map(f => ({ f, size: statSync(join(DIST, f)).size }))
            .filter(({ size }) => size > SINGLE_CHUNK_LIMIT);
        const msg = oversize.map(({ f, size }) => `  ${f}: ${(size / 1024).toFixed(1)}KB`).join('\n');
        expect(oversize, `chunks excedem ${SINGLE_CHUNK_LIMIT / 1024}KB:\n${msg}`).toEqual([]);
    });

    it('total dist/assets/*.js ≤ 3.2MB', () => {
        const files = readdirSync(DIST).filter(f => f.endsWith('.js'));
        const total = files.reduce((s, f) => s + statSync(join(DIST, f)).size, 0);
        const msg = `total: ${(total / 1024 / 1024).toFixed(2)}MB (limite: ${TOTAL_LIMIT / 1024 / 1024}MB)`;
        expect(total, msg).toBeLessThanOrEqual(TOTAL_LIMIT);
    });
});
