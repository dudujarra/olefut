/**
 * SPEC-164 §4 — Sidebar nav sem crash
 *
 * Visita todos os itens do sidebar do modo manager e garante que:
 *  - cada view renderiza conteúdo visível
 *  - nenhum erro de página (pageerror) acontece durante a sequência
 *
 * Cobre o gap "0/12 views com smoke test" do audit AKITA-233.
 */
// SPEC-176: shared fixture auto-fails on uncaught pageerror / console.error.
// (Below we still keep a local error[] inspection for noise-free debug output.)
import { test, expect } from './_fixtures.js';

const NAV_LABELS = [
    'DASHBOARD',
    'PLANTEL',
    'MERCADO',
    'TABELA',
    'CONQUISTAS',
    'COLETIVA',
    'LOJA',
    'RIVALIDADES',
    'CRÔNICA',
    'SAVES',
    'AUTOPLAY',
    'TUTORIAL'
];

async function startCareer(page) {
    await page.addInitScript(() => {
        try {
            localStorage.clear();
            localStorage.setItem('elifoot_tutorial_done', 'true');
        } catch { /* ignore */ }
    });
    await page.goto('/');
    await page.waitForSelector('#input-name', { timeout: 15_000 });
    await page.fill('#input-name', 'Sidebar E2E');
    const firstValue = await page.locator('select#select-team option[value]:not([value=""])').first().getAttribute('value');
    await page.selectOption('select#select-team', firstValue);
    await page.locator('#btn-start').click();
    await page.waitForSelector('header.top-bar', { timeout: 10_000 });
}

test.describe('SPEC-164 §4: Sidebar nav sem crash', () => {

    test('todos os itens do sidebar manager renderizam algo sem pageerror', async ({ page }) => {
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await startCareer(page);

        for (const label of NAV_LABELS) {
            // TUTORIAL não tem sidebar (Sidebar.jsx retorna null em view 'tutorial');
            // por isso clicamos via aside enquanto disponível.
            const sidebar = page.locator('aside.elifoot-sidebar');
            if (label !== 'DASHBOARD' && !(await sidebar.isVisible().catch(() => false))) {
                // Voltamos via header se possível
                await page.goto('/');
                await page.waitForSelector('header.top-bar', { timeout: 10_000 });
            }

            const item = sidebar.getByText(label, { exact: true }).first();
            await expect(item).toBeVisible();
            await item.click();
            // Wait até main ter conteúdo
            await page.waitForFunction(() => {
                const main = document.querySelector('main');
                return main && main.innerText.trim().length > 30;
            }, { timeout: 15_000 });

            const txt = await page.locator('main').first().innerText();
            expect(txt.length).toBeGreaterThan(30);
        }

        // Sem crashes ao longo da sequência. Filtra noise conhecida.
        const critical = errors.filter(e =>
            !e.includes('ResizeObserver') &&
            !e.toLowerCase().includes('favicon')
        );
        expect(critical, `pageerror durante nav:\n${critical.join('\n')}`).toHaveLength(0);
    });
});
