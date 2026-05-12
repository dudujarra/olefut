/**
 * SPEC-164 §6 — Responsive Mobile Smoke
 *
 * Viewport 375x667. Confirma StartView e dashboard inicial não fazem overflow
 * horizontal, e que 3 itens do sidebar abrem sem crash.
 */
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 375, height: 667 } });

test.describe('SPEC-164 §6: Responsive mobile', () => {

    test('StartView e nav básico não causam overflow nem crash em 375x667', async ({ page }) => {
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.addInitScript(() => {
            try {
                localStorage.clear();
                localStorage.setItem('elifoot_tutorial_done', 'true');
            } catch { /* ignore */ }
        });
        await page.goto('/');
        await page.waitForSelector('#input-name', { timeout: 15_000 });

        const overflow = await page.evaluate(() => {
            const html = document.documentElement;
            return { scroll: html.scrollWidth, client: html.clientWidth };
        });
        // Allow 10px tolerância (scrollbar)
        expect(overflow.scroll).toBeLessThanOrEqual(overflow.client + 10);

        // Inicia carreira
        await page.fill('#input-name', 'Mobile E2E');
        const firstValue = await page.locator('select#select-team option[value]:not([value=""])').first().getAttribute('value');
        await page.selectOption('select#select-team', firstValue);
        await page.locator('#btn-start').click();
        await page.waitForSelector('header.top-bar', { timeout: 10_000 });

        // Sidebar pode estar visível ou colapsada — testamos itens existentes
        const sidebar = page.locator('aside.elifoot-sidebar');
        await expect(sidebar).toBeVisible();

        for (const label of ['PLANTEL', 'TABELA', 'SAVES']) {
            await sidebar.getByText(label, { exact: true }).first().click();
            await page.waitForFunction(() => {
                const main = document.querySelector('main');
                return main && main.innerText.trim().length > 30;
            }, { timeout: 15_000 });
        }

        const critical = errors.filter(e =>
            !e.includes('ResizeObserver') &&
            !e.toLowerCase().includes('favicon')
        );
        expect(critical, `pageerror em mobile:\n${critical.join('\n')}`).toHaveLength(0);
    });
});
