/**
 * SPEC-164 harness (Regra 0) — valida que a config e os scripts E2E estão coerentes.
 *
 * Roda com Vitest junto com a suite default. Mantém o gate vivo sem precisar
 * subir Playwright na CI default (que tem job dedicado).
 */
import { describe, test, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '..', '..');

describe('SPEC-164: E2E config integrity', () => {

    test('playwright.config.js existe e expõe webServer port 5173', async () => {
        const cfgPath = resolve(ROOT, 'playwright.config.js');
        expect(existsSync(cfgPath)).toBe(true);
        const mod = await import(cfgPath);
        const cfg = mod.default;
        expect(cfg).toBeTruthy();
        expect(cfg.testDir).toMatch(/tests\/e2e/);
        expect(cfg.webServer).toBeTruthy();
        expect(cfg.webServer.port).toBe(5173);
        expect(Array.isArray(cfg.projects)).toBe(true);
        expect(cfg.projects.some(p => p.name === 'chromium')).toBe(true);
    });

    test('package.json expõe scripts test:e2e, test:e2e:ui, test:e2e:install', () => {
        const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
        expect(pkg.scripts['test:e2e']).toBe('playwright test');
        expect(pkg.scripts['test:e2e:ui']).toMatch(/^playwright test/);
        expect(pkg.scripts['test:e2e:install']).toMatch(/playwright install/);
    });

    test('os 6 arquivos .spec.js de SPEC-164 existem', () => {
        const required = [
            'tests/e2e/start-team-select.spec.js',
            'tests/e2e/save-reload-roundtrip.spec.js',
            'tests/e2e/advance-week-standings.spec.js',
            'tests/e2e/sidebar-nav-no-crash.spec.js',
            'tests/e2e/tutorial-completable.spec.js',
            'tests/e2e/responsive-mobile.spec.js'
        ];
        for (const rel of required) {
            const p = resolve(ROOT, rel);
            expect(existsSync(p), `missing ${rel}`).toBe(true);
            const txt = readFileSync(p, 'utf8');
            expect(txt.length, `${rel} empty`).toBeGreaterThan(200);
            // Cada spec deve linkar a SPEC-164 no header (rastreabilidade Akita).
            expect(txt).toMatch(/SPEC-164/);
        }
    });

    test('CI workflow inclui job e2e', () => {
        const ci = readFileSync(resolve(ROOT, '.github/workflows/ci.yml'), 'utf8');
        expect(ci).toMatch(/^\s+e2e:/m);
        expect(ci).toMatch(/npx playwright install/);
        expect(ci).toMatch(/npm run test:e2e/);
    });

    test('nenhuma .spec.js E2E usa data-testid (zero acoplamento src↔testes)', () => {
        const files = [
            'tests/e2e/start-team-select.spec.js',
            'tests/e2e/save-reload-roundtrip.spec.js',
            'tests/e2e/advance-week-standings.spec.js',
            'tests/e2e/sidebar-nav-no-crash.spec.js',
            'tests/e2e/tutorial-completable.spec.js',
            'tests/e2e/responsive-mobile.spec.js'
        ];
        for (const rel of files) {
            const txt = readFileSync(resolve(ROOT, rel), 'utf8');
            // Permite menção em comentários, proíbe seletor real.
            expect(txt, `${rel} usa data-testid`).not.toMatch(/\[data-testid=/);
        }
    });
});
